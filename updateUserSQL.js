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
	// var newUserPassword
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

        // sql statement to update a user information, contain a problem of updating password
        var sqlQuery = `if exist(SELECT * FROM [User] Where UserName = @userName and UserPassword = @userPassword)
                        BEGIN
						    update [User]
							set FirstName = @firstName, LastName = @lastName, Email = @email, Phone = @phone
							where UserName = @userName                    
                            
                            SELECT TOP 1 [UserID], [UserName], [UserPassword], [FirstName], [LastName], [Email], [Phone] FROM [User] WHERE UserName = @userName
                        END`;
        
        // userName and userPassword should get from log in first
		request.input('userName', sql.VarChar, userName)
        request.input('userPassword', sql.VarChar, userPassword)
		// for user to update
        request.input('firstName', sql.VarChar, firstName)
        request.input('lastName', sql.VarChar, lastName)
        request.input('email', sql.VarChar, email)
        request.input('phone', sql.VarChar, phone)
        
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