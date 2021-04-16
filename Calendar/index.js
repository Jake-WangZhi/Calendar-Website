// YOU CAN USE THIS FILE AS REFERENCE FOR SERVER DEVELOPMENT

// include the express module
var express = require("express");

// create an express application
var app = express();

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

// fs module - provides an API for interacting with the file system
var fs = require("fs");

// helps in managing user sessions
var session = require('express-session');

// native js function for hashing messages with the SHA-256 algorithm
var crypto = require('crypto');

// include the mysql module
var mysql = require("mysql");

var xml2js = require('xml2js');

var parser = new xml2js.Parser();


var con;
fs.readFile(__dirname + '/dbconfig.xml', function(err, data) {
	if (err) throw err;
	console.log("data: \n" + data);
    parser.parseString(data, function (err, result) {
		if (err) throw err;
		con = mysql.createConnection({
        host: result.dbconfig.host[0],
        user: result.dbconfig.user[0], // replace with the database user provided to you
        password: result.dbconfig.password[0], // replace with the database password provided to you
        database: result.dbconfig.database[0], // replace with the database user provided to you
        port: result.dbconfig.port[0]
       }); 
      con.connect(function(err) {  
	   if (err) {    
		  throw err;  
	      };  
       console.log("Connected to MYSQL database!");
      });       

	});
});


// apply the body-parser middleware to all incoming requests
app.use(bodyparser());

// use express-session
// in mremory session is sufficient for this assignment
app.use(session({
  secret: "csci4131secretkey",
  saveUninitialized: true,
  resave: false
}));

// server listens on port 9007 for incoming connections
app.listen(9367, () => console.log('Listening on port 9367!'));

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/welcome.html');
});

// // GET method route for the events page.
// It serves events.html present in client folder
app.get('/events',function(req, res) {
  if(!req.session.value) {
   res.redirect(302,'/login'); 
  }else{
   res.sendFile(__dirname + '/client/events.html');
  }
});

// GET method route for the addEvent page.
// It serves addEvent.html present in client folder
app.get('/addEvent',function(req, res) {
 if(!req.session.value) {
   res.redirect(302,'/login'); 
  }else{	
  res.sendFile(__dirname + '/client/addEvent.html');
 }
});

//GET method for stock page
app.get('/stock', function (req, res) {
 if(!req.session.value) {
   res.redirect(302,'/login'); 
  }else{	
  res.sendFile(__dirname + '/client/stock.html');
}
});





// GET method route for the login page.
// It serves login.html present in client folder
app.get('/login',function(req, res) {
  res.sendFile(__dirname + '/client/login.html');
});

// GET method to return the list of events
// The function queries the tbl_events table for the list of events and sends the response back to client
app.get('/getListOfEvents', function(req, res) {
  //Add Details
  if(!req.session.value) {
   res.redirect(302,'/login'); 
  }else{
     con.query('SELECT * FROM tbl_events' , function(err,rows,fields) {
	  
	 if (err) throw err;

     if (rows.length == 0){
        res.send({"events":[]});
     }else{
	   var eventsArray=[];	 
	   for(var i=0; i<rows.length; i++){
		   var jsonObj={};
           jsonObj['day'] = rows[i].event_day;
           jsonObj['event'] = rows[i].event_event;
           jsonObj['start'] = rows[i].event_start;
           jsonObj['end'] = rows[i].event_end;
           jsonObj['location'] = rows[i].event_location;
           jsonObj['phone'] = rows[i].event_phone;
           jsonObj['info'] = rows[i].event_info;
           jsonObj['url'] = rows[i].event_url;
           eventsArray.push(jsonObj);
           console.log (eventsArray);
	   }
	   var returnObj={"events":eventsArray};
	   //var responseObj={res:returnObj};
	   res.send(JSON.stringify(returnObj));
	 }
   }); 
  }
});

// POST method to insert details of a new event to tbl_events table
app.post('/postEvent', function(req, res) {
  //Add Details
   if(!req.session.value) {
   res.redirect(302,'/login'); 
  }else{	
   var obj={};
   obj.event_day=req.body.day;
   obj.event_event=req.body.event;
   obj.event_start=req.body.start;
   obj.event_end=req.body.end;
   obj.event_location=req.body.location;
   obj.event_phone=req.body.phone;
   obj.event_info=req.body.info;
   obj.event_url=req.body.url;
   con.query('INSERT tbl_events SET ?',obj, function(err,result){
	if(err) throw err;
    });   
    res.redirect(302,'/events'); 
   }
  
});


/*
var con = mysql.createConnection({
  host: "cse-larry.cse.umn.edu",
  user: "C4131F20U110", // replace with the database user provided to you
  password: "12130", // replace with the database password provided to you
  database: "C4131F20U110", // replace with the database user provided to you
  port: 3306
});

con.connect(function(err) {  
	if (err) {    
		throw err;  
	};  
 console.log("Connected to MYSQL database!");
 });
 
*/
// POST method to validate user login
// upon successful login, user session is created
app.post('/sendLoginDetails', function(req, res) {
  //Add Details
  var loginInfo = req.body;
  var login = loginInfo.login;
  var pwd = loginInfo.password;
// Query the database with login and hashed password
// Provided there is no error, and the results set is assigned to a variable named rows:
  con.query('SELECT * FROM tbl_accounts' , function(err,rows,fields) {

	if (err) throw err;
    var check=0;
    if (rows.length >= 1){
	  // the length should be 0 or 1, but this will work for now 
	  //success, set the session, return success
     for(var i=0; i<rows.length; i++){
	  if((rows[i].acc_login==login)&&(rows[i].acc_password==crypto.createHash('sha256').update(pwd).digest('base64'))){
		  req.session.value=1;
	     req.session.user = login;

	     check=1;
	  }
	  }
	  if(check==0){
	    res.json({status:'fail'});
      }else{
		 res.json({status:'success'}); 
		  }
    }
   }); 
});

// log out of the application
// destroy user session
app.get('/logout', function(req, res) {
  if(!req.session.value) {
	  res.send('Session not started, can not logout!');
  } else {
	  console.log ("Successfully Destroyed Session!");
	  req.session.destroy();
	  //res.send("Session Complete!");
	  res.redirect('/login'); 
  }
});


app.get('/admin',function(req, res) {
  if(!req.session.value) {
   res.redirect(302,'/login'); 
  }else{
   res.sendFile(__dirname + '/client/admin.html');
  }
});



app.get('/getListOfUsers', function (req, res) {
 if(!req.session.value) {
   res.redirect(302,'/login'); 
  }else{	
       con.query('SELECT * FROM tbl_accounts' , function(err,rows,fields) {

	   if (err) throw err;

	   var objArray=[];	 
	   for(var i=0; i<rows.length; i++){
           var obj = { id: rows[i].acc_id,
			           name: rows[i].acc_name,
			           login: rows[i].acc_login,
			           password: rows[i].acc_password
			          };
		   objArray.push(obj);
	   }
	   res.json(objArray);
 
       }); 
  }
});

app.post('/addUser', function (req, res) {
 if(!req.session.value) {
   res.redirect(302,'/login'); 
  }else{	
	  
	   var v=req.body.login;
       con.query('SELECT * FROM tbl_accounts WHERE acc_login=?' , [v],function(err,rows,fields) {

	   if (err) throw err;

       if (rows.length == 0){
           var rowToBeInserted = {
            acc_name: req.body.name, // replace with acc_name chosen by you OR retain the same value
            acc_login: req.body.login, // replace with acc_login chosen by you OR retain the same vallue
            acc_password: crypto.createHash('sha256').update(req.body.password).digest('base64') // replace with acc_password chosen by you OR retain the same value
           };

           var sql = ``;
           con.query('INSERT tbl_accounts SET ?', rowToBeInserted, function(err, result) {
              if(err) {
               throw err;
              }
              res.send({flag:true, id:result.insertId});	   
           });	
           

	   }else{
		   
		   res.send({flag:false});
		   
		   }
 
       }); 
  }
});


app.post('/updateUser', function (req, res) {
 if(!req.session.value) {
   res.redirect(302,'/login'); 
  }else{	

		   if(req.session.user==req.body.login){
			   res.send({flag:false});
		   }else{	
			 var v1=req.body.login;
			 var v2=req.body.id;	   
			con.query('SELECT * FROM tbl_accounts WHERE acc_login=? AND acc_id!=?' ,[v1,v2],function(err,result,field) {
			 if (err) throw err;
             if (result.length == 0){	
				 var name=req.body.name;
				 var login=req.body.login;
				 var password=req.body.password;		 
			     if(!req.body.password){
					 con.query('UPDATE tbl_accounts SET acc_name=?,acc_login=? WHERE acc_id=?',[name,login,v2],function(err,result){
						if (err) throw err;
						 
			       });			
				 }else{
					 con.query('UPDATE tbl_accounts SET acc_name=?,acc_login=?,acc_password=? WHERE acc_id=?',[name,login,crypto.createHash('sha256').update(password).digest('base64'),v2],function(err,result){
						if (err) throw err;						 
			       });						   	 
					 
			     }
			   res.send({flag:true}); 
		     }else{
				 res.send({flag:false}); 
				 }
			});  
		   }	
		   
  }
});


app.post('/deleteUser', function (req, res) {
 if(!req.session.value) {
   res.redirect(302,'/login'); 
  }else{	
    if(req.session.user!=req.body.login){
		  var accLogin = req.body.login;
          con.query('DELETE FROM tbl_accounts WHERE acc_login=?',[accLogin],function(err,result){
			 if (err) throw err;
		 });
		 res.send({flag:true}); 
    }else{
         res.send({flag:false});
		}
  }
});


app.get('/userLogin',function(req, res) {
  if(!req.session.value) {
   res.redirect(302,'/login'); 
  }else{
    res.send({login:req.session.user});
  }
});


// middle ware to serve static files
app.use('/client', express.static(__dirname + '/client'));


// function to return the 404 message and error to client
app.get('*', function(req, res) {
  res.sendStatus(404);
});







