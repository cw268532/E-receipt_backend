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
    console.log("requestSHHHHHHH: " + JSON.stringify(event.body.receiptName));

    context.callbackWaitsForEmptyEventLoop = false;
    
   // variable for sql query use in the following
    var receiptName = event.body.receiptName;
    console.log("username from request: " + receiptName)
    
    

    // SQL connect
    sql.connect(config, function(errors) {
        if (errors) console.log(errors);

        // create Request object for allowing another lambda function getting img
        var request = new sql.Request();
        // testing the case if user got multiple receipts
        var sqlQuery = `delete from [Receipt2] 
                        where receiptName = @receiptName
                        `
        request.input('receiptName', sql.VarChar, receiptName)
        
        
        
        
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