'use strict'

var AWS = require('aws-sdk');
var sql = require('mssql');
var TYPES = require('tedious').TYPES;

//s3 reference
var s3 = new AWS.S3();

// data connect
var config = {
    user: 'ereceipts',
    password: 'ereceiptstest',
    server: 'ereceiptstest.cj3uvfpzau1a.us-east-2.rds.amazonaws.com',
    database: 'ereceiptstest'  
};

exports.handler = (event, context, callback) => {
    let responseCode = 200;
    console.log("requestSHHH: " + JSON.stringify(event));
    console.log("requestSHHHHHHH: " + JSON.stringify(event.body.receiptName));

    context.callbackWaitsForEmptyEventLoop = false;
  
    var receiptName = event.body.receiptName;
    
    console.log("recieptName from request: " + receiptName)

    // SQL connect
    sql.connect(config, function(errors) {
        if (errors) console.log(errors);

        // create Request object
        var request = new sql.Request();

        var sqlQuery = `select * from [Receipt2] 
                       where receiptName = @receiptName`
        request.input('receiptName', sql.VarChar, receiptName)
        
        request.query(sqlQuery, function(errors, recordset) {
            if (errors) {
                console.log(errors)
            }
            sql.close();
            tableData(recordset, errors);
        });

    });

    const tableData = function(data1, errors) {
        //s3 connection
        
        if(data1.recordset.length > 0)
        {
            var params = {
              Bucket: data1.recordset[0].receiptImgSrcBucket,
              Key: data1.recordset[0].receiptImgSrcKey
            };
            
            var url = s3.getSignedUrl('getObject',params);
            
            //console.log("url is :  "+url);
            
            httpResponse(url,errors);

        }
        else httpResponse(null,errors);
    };
	
	const httpResponse = function(imgUrl, errors)
	{
		var responseBody = {
            message: imgUrl,
            error: errors,
        };

        var response = {
            statusCode: responseCode,
            headers: {
                "x-custom-header": "BLANK_HEADER"
            },
            body: JSON.stringify(responseBody)
        };
        
        callback(null, response);
	};
};