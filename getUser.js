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

exports.handler = function(event, context, callback) {
    let responseCode = 200;
    console.log("request: " + JSON.stringify(event));

    context.callbackWaitsForEmptyEventLoop = false;


    var userNameToRead = event.body.userName
    var passwordRead = event.body.password
    
    console.log("username from request: " + userNameToRead)

    // SQL connect
    sql.connect(config, function(errors) {
        if (errors) console.log(errors);

        // create Request object
        var request = new sql.Request();

        // query to the database and get the records
        var sqlQuery = 'SELECT TOP 1 [UserID], [UserName], [UserPassword], [FirstName], [LastName], [Email], [Phone] FROM [User] WHERE UserName = @userName AND UserPassword = @userPassword';
        request.input('userName', sql.VarChar, userNameToRead)
        request.input('userPassword', sql.VarChar, passwordRead)
        
        request.query(sqlQuery, function(errors, recordset) {
            if (errors) {
                console.log(errors)
            }
            sql.close();
            console.log(recordset)
            // send records as a response
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

        console.log("response: " + JSON.stringify(response))
        callback(null, response);
    };
};