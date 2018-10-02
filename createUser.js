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
    console.log("requestSHHH: " + JSON.stringify(event));
    console.log("requestSHHHHHHH: " + JSON.stringify(event.body.userName));

    context.callbackWaitsForEmptyEventLoop = false;
    var json = JSON.parse(event.body);


    var userName = json.userName
    var userPassword = json.userPassword
    var firstName = json.firstName
    var lastName = json.lastName
    var email = json.email
    var phone = json.phone
    
    console.log("username from request: " + userName)

    // SQL connect
    sql.connect(config, function(errors) {
        if (errors) console.log(errors);

        // create Request object
        var request = new sql.Request();

        // sql statement to create a user if it does not exist
        var sqlQuery = `IF NOT EXISTS (SELECT TOP 1 1 FROM [User] Where UserName = @userName)
                        BEGIN
                            INSERT INTO [User] (UserName, UserPassword, FirstName, LastName, Email, Phone)
                            VALUES (@userName, @userPassword, @firstName, @lastName, @email, @phone);
                            
                            SELECT TOP 1 [UserID], [UserName], [UserPassword], [FirstName], [LastName], [Email], [Phone] FROM [User] WHERE UserName = @userName
                        END
                        ELSE
                        BEGIN
                            RAISERROR ('Error when trying to create a user, user already exists.', -- Message text.
                               16, -- Severity.
                               1 -- State.
                               );
                        END`;
        
        request.input('userName', sql.VarChar, userName)
        request.input('userPassword', sql.VarChar, userPassword)
        request.input('firstName', sql.VarChar, firstName)
        request.input('lastName', sql.VarChar, lastName)
        request.input('email', sql.VarChar, email)
        request.input('phone', sql.VarChar, phone)
        
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

        console.log("response: " + JSON.stringify(response))
        callback(null, response);
    };
};