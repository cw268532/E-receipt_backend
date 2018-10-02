'use strict';

var sql = require('mssql');
var TYPES = require('tedious').TYPES;

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
    console.log("requestSHHHHHHH: " + JSON.stringify(event.body.username));

    context.callbackWaitsForEmptyEventLoop = false;
    
    //setting a place for username which will use for finding query by the username
    var userName = event.body.userName;
    console.log("username from request: " + userName)
    
    /*
    this is a thought for getting username
    
    var json = JSON.parse(event.body);
    var userName = json.userName
    var userPassword = json.userPassword
    */
    

    // SQL connect
    sql.connect(config, function(errors) {
        if (errors) console.log(errors);

        // create Request object for allowing another lambda function getting img
        var request = new sql.Request();
        // testing the case if user got multiple receipts
        var sqlQuery = `select * from [Receipt2] 
                        where receiptOwnerUserID = (select UserID from [User] where UserName = @userName)
                        order by receiptID`
        request.input('userName', sql.VarChar, userName)
        
        // create another request for showing to user
        var request2 = new sql.Request();
        var sqlQuery = `select receiptName, receiptDate, cost from [Receipt2] 
                        where receiptOwnerUserID = (select UserID from [User] where UserName = @userName)
                        order by receiptID`
        
        
        request.query(sqlQuery, function(errors, recordset) {
            if (errors) {
                console.log(errors)
            }
            sql.close();
            httpResponse(recordset, errors);
        });

    });

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

    callback(null, response);
    };
};