'use strict'

var AWS = require('aws-sdk');
var sql = require('mssql');
var TYPES = require('tedious').TYPES;
var fs = require('fs');
var FileReader = require('filereader');
//s3 reference
var s3 = new AWS.S3();
// data connect
var config = {
    user: 'ereceipts',
    password: 'ereceiptstest',
    server: 'ereceiptstest.cj3uvfpzau1a.us-east-2.rds.amazonaws.com',
    database: 'ereceiptstest'
};

const Bucket = "ereceiptsbucket";

exports.handler = (event, context, callback) => {
    let responseCode = 200;
    console.log("request EVENT: " + JSON.stringify(event));
    console.log("request BODY: " + JSON.stringify(event.body));
    context.callbackWaitsForEmptyEventLoop = false;

    // Varialbes used to get base64 img and username
    var requset = event.body;
    var inbase64 = requset.image
    var receiptImgSrcBucket = Bucket
    var cost = 0;
    //Convert base64 username back to text
    let b64UserName = requset.userName
    let buff = new Buffer(b64UserName,'base64');
    let userName = buff.toString('ascii');

    // current date and time used as Receipt Name
    const getDateTime = function(request) {
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth()+1;
        month = (month < 10 ? "0" : "") + month;
        var day = date.getDate();
        day = (day < 10 ? "0" : "") + day;
        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;
        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;
        var millisec = date.getMilliseconds();
        if (request == 'date'){
          return year+"-"+month+"-"+day;
        }
        return year+"-"+month+"-"+day+"-"+hour+"-"
            +min+"-"+millisec;
    }

    // ONLy FOR TESTING part 1
        // function to read in file and convert to base64
    function base64_encode(file){
        var img = fs.readFileSync(file);
        return new Buffer(img).toString('base64');
    }
    // ONLy FOR TESTING part 2
      // call to base64 function
    //inbase64 = base64_encode('sample.jpg');

    // take base64 string create buffer for S3 bucket body
    var buffer = new Buffer(inbase64,'base64');

    // get current date used as name of file/ reciptName
    var receiptDate = getDateTime('date');
    var receiptName = getDateTime();
    var receiptImgSrcKey = userName+"/"+receiptName+".jpg";
    // Function to upload image to S3 bucket
    
    const uploadToBucket = function(){
      // Create S3 Bucket parameters
        var params = {
            Bucket: Bucket,
            Key: receiptImgSrcKey,
            Body: buffer,
            ContentEncoding: 'base64',
            ContentType: 'image/jpg'
        };
        //upload to S3 bucket
        s3.upload(params, function(err, data){
            if (err) {
                console.log(err, err.stack);
                console.log("Failed loading image");
            }
            else {
                console.log(data);
                console.log("Success Image loaded");
            }
        });
    }
    /*
    uploadToBucket();
    */
    /// async function uses await
    async function asyncQuery() {
        try {
            // open SQL connection
            sql.close();
            const pool = await sql.connect(config);
            // Query to get User ID waits for response
            const result = await pool.query`select UserID from [User] where UserName = ${userName}`;
            //console.log("THE RESULT: " +result.recordset[0].UserID);
            if (result.recordset[0] == null){
                var error = "Invalid UserName: "+userName+" not in database"
                responseCode = 400;
                pool.close()
                httpResponse(null,error);
                return;
            }
            var uid = result.recordset[0].UserID;
            // 2nd query to insert into Receipt2 database
            const result2 = await pool.query`
                            BEGIN
                                INSERT INTO [Receipt2]
                                (receiptName, receiptDate, receiptOwnerUserID, receiptImgSrcBucket, receiptImgSrcKey, cost)
                                VALUES
                                (${receiptName}, ${receiptDate}, ${uid}, ${receiptImgSrcBucket}, ${receiptImgSrcKey}, ${cost});
                            END`;

            // close SQL connection
            pool.close();
            
            uploadToBucket();
            
            httpResponse(result2,null);
        } catch (err) {
            // ... error checks
            console.log(err)
            httpResponse(null, err);
        }
    }
    asyncQuery();


    //Build htt response to send back
    const httpResponse = function(data1, errors) {
        var responseBody = {
            message: data1,
            error: errors,
        };

        var response = {
            statusCode: responseCode,
            headers: {
                "x-custom-header": "BLANK_HEADER"
            },
            body: JSON.stringify(responseBody)
        };

        console.log("response: " + JSON.stringify(response))
        callback(null, response);
    };
};
