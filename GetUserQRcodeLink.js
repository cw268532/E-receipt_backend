'use strict';

exports.handler = (event, context, callback) => {
    let responseCode = 200;
    console.log("request event: " + JSON.stringify(event));
    console.log("request username: " + JSON.stringify(event.body.userName));

    context.callbackWaitsForEmptyEventLoop = false;
    
    var userName = event.body.userName
    
    if (userName == null || userName == '')
    {
        console.log("Username was either null or empty, will throw error.");
        throw "User name is empty or null, please provide a valid user name";
    }
    
    let buffer = new Buffer(userName);  
    let usernameEncoded = buffer.toString('base64');
    
    console.log('"Username: ' + userName + ' converted to Base64 is: "' + usernameEncoded + '"');  
    
    var url = `https://6cl2u8dzoi.execute-api.us-east-2.amazonaws.com/StageOne/putreceiptimage?id=${usernameEncoded}`;
    
    console.log("URL returned is: " + url);
    callback(null, url);
};