const express = require('express');
const path = require('path');
const ejs = require('ejs');
const session = require('express-session');
var bodyParser = require('body-parser');
var mysql = require('mysql');
const port=3000;
const app = express();
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '24685864',
	database: 'project',
	dateStrings: true
});
connection.connect();
app.use(session({
	secret: 'helloworld',
	resave: true,
	saveUninitialized: true
}));
var ath=0;
app.use('/public', express.static('public'));
app.listen(port, function(){
    console.log("Server is running on " + port +" port");
});

app.get('/',(req,res,next)=>{
	res.redirect('/logout');
});

app.get('/home',(req,res)=>{
    res.redirect('/');
})
app.get('/student',(req,res,next)=>{
	 
	if (req.session) {
		req.session.destroy(function(err) {
		  if(err) {
			  ath=0;
			return next(err);
		  }
		});
	}
      res.render('studentlogin.ejs',{str: ""});
});
app.get('/faculty',(req,res)=>{
	if (req.session) {
		req.session.destroy(function(err) {
		  if(err) {
			return next(err);
		  }
		});
	}
      res.render('facultylogin.ejs',{str: ""});
});
app.get('/admin',(req,res)=>{
	if (req.session) {
		req.session.destroy(function(err) {
		  if(err) {
			return next(err);
		  }
		});
	}
    res.render('adminlogin.ejs',{str: ""});
});
app.get('/about',(req,res)=>{
	res.render('about.ejs');
});
app.get('/take',(req,res)=>{
	if (req.session.loggedin && ath==2)
	  res.render('search.ejs',{str:""});
	else
	  res.redirect('/faculty');
});

app.get('/view',(req,res)=>{
	if (req.session.loggedin && ath==1)
	  res.render('view.ejs');
	  else
	  res.redirect('/admin');
});
app.get('/viewf',(req,res)=>{
	if (req.session.loggedin && ath==2)
	 res.render('viewf.ejs');
	 else
	 res.redirect('/faculty');
})

//Function to view attendance from faculty account
app.post('/searchf',(req,res)=>{
	  connection.query("select student.rollno,attendance.date from student,attendance where student.rollno=attendance.rollno and TID=? and upper(course)=upper(?) and semester=?",[req.session.username,req.body.Course,req.body.Semester],(err,data)=>{
		  if(err)
		  throw err;
		  res.render('indexatf.ejs',{userData: data});
	  })
})

//Function to view list of teachers from admin account
app.get('/viewft',(req,res)=>{
	if (req.session.loggedin && ath==1)
	{  connection.query("select * from faculty",(err,data,fields)=>{
		   if(err)
		   throw err;
		   res.render('indexft.ejs',{userData: data});
	  });
	}
	else
	res.redirect('/admin');
});

app.get('/viewat',(req,res)=>{
    if (req.session.loggedin && ath==3)
    {connection.query("select TID from faculty",(err,data)=>{
		if(err)
		throw err;
		res.render('viewat.ejs',{userdata: data})
	});
}
  else
  res.redirect('/student');
});

//function to view attendance from student account
app.post('/searchft',(req,res)=>{
	if (req.session.loggedin && ath==3)
  {	connection.query("select * from attendance where TID=? and rollno=?",[req.body.tid,req.session.username],(err,data)=>{
		if(err)
		throw err;

   connection.query("select course,semester from student where rollno=?",[req.session.username],(error,dat)=>{
	   if(error)
	   throw err;
	 connection.query("select count(distinct date) as total from (select name,course,semester,student.rollno,attendance.date from student,attendance where student.rollno=attendance.rollno and TID=? and upper(course)=upper(?) and semester=?) as T;",[req.body.tid,dat[0].course,dat[0].semester],(er,result)=>{
		if(er)
		throw er;
		if(result[0].total)
		var x=Math.round(((data.length)/result[0].total)*100);
		else
		var x="No classes taken"
		res.render('indexat.ejs',{ userData: data , percent: x });
	  });
	});
  });
}
else
res.redirect('/student');
});
app.get('/editst/:id',(req,res)=>{
	if (req.session.loggedin && ath==1)
	res.render('editst.ejs',{rollno: req.params.id});
	else
	res.redirect('/admin');
});

app.get('/editft/:id',(req,res)=>{
	if (req.session.loggedin && ath==1)
	res.render('editft.ejs',{tid: req.params.id});
	else
	res.redirect('/admin');
});

//function to delete student
app.get('/delst/:id',(req,res)=>{
	if(req.session.loggedin && ath==1)
	{
    connection.query("delete from student where rollno=?",[req.params.id],(err)=>{
		if(err)
		throw err;
		res.render('adminmenu.ejs',{username: req.session.username,str: "Record Deleted"});
	});
}
else
res.redirect('/admin');
});

//function to delete faculty
app.get('/delft/:id',(req,res)=>{
	if (req.session.loggedin && ath==1)
{	connection.query("delete from faculty where TID=?",[req.params.id],(err)=>{
		if(err)
		throw err;
		res.render('adminmenu.ejs',{username: req.session.username,str: "Record Deleted"});
	});
}
else
res.redirect('/admin');
});

//function to edit student details
app.post('/editst/:id',(req,res)=>{
    connection.query("update student set name=?,course=?,date=?,semester=?,password=? where rollno=?",[req.body.name,req.body.course,req.body.dob,req.body.sem,req.body.password,req.params.id],(err,data,fields)=>{
        if(err) throw err;
		res.render('adminmenu.ejs',{username: req.session.username,str: "Record Updated"});
	});
});

//function to edit faculty details
app.post('/editft/:id',(req,res)=>{
    connection.query("update faculty set Name=?,Department=?,password=? where TID=?",[req.body.name,req.body.Dept,req.body.password,req.params.id],(err)=>{
		if(err) 
		throw err;
	});
	
	connection.query("delete from teaches where TID=?",[req.params.id],(err)=>{
		if(err)
		throw err;
	});
    var x=req.body.BCSv;
	for(var i=0;i<x.length;i++)
{	
	if(x[i]=='1')
 {	connection.query("insert into teaches values (?,?,?)",[req.params.id,'BCS',i+1],(err)=>{ 
		 if(err)
		 throw err;
	});
 }
}
var x=req.body.IMTv;
for(var i=0;i<x.length;i++)
{	
if(x[i]=='1')
{	connection.query("insert into teaches values (?,?,?)",[req.params.id,'IMT',i+1],(err)=>{ 
	 if(err)
	 throw err;
});
}
}
var x=req.body.IMGv;
for(var i=0;i<x.length;i++)
{	

if(x[i]=='1')
{	connection.query("insert into teaches values (?,?,?)",[req.params.id,'IMG',i+1],(err)=>{ 
	 if(err)
	 throw err;
});
}
}
res.render('adminmenu.ejs',{username: req.session.username,str: "Record Updated"});
});

app.post('/searchview',(req,res)=>{
    connection.query("select rollno,name,course,date,semester from student where semester=? and UPPER(course)=UPPER(?)",[req.body.Semester,req.body.Course],(err,data,fields)=>{
        if(err)
        throw err;
		res.render('index2.ejs',{userData: data});
 });
});
var date;
var rec;
//function to display student list for taking attendance
app.post('/search',(req,res)=>{
  
	connection.query("select * from teaches where course=? and semester=? and TID=?",[req.body.Course,req.body.Semester,req.session.username],(err,data)=>{
		   if(err)
		   throw err;

      if(data.length)
   { connection.query("select rollno,name,course,date,semester from student where semester=? and UPPER(course)=UPPER(?)",[req.body.Semester,req.body.Course],(err,result,fields)=>{
           if(err)
		   throw err;
		   rec=result;
           date=req.body.date;
           res.render('index.ejs',{userData: rec});
	 });
   }
   else
   {
	   res.render('search.ejs',{str:"You don't teach this batch"});
   }
  });
});

//function for submitting attenadance from fauclty account
app.post('/submit',(req,res)=>{
	var x=req.body.Selected;
	console.log(rec);
    for(let i=0;i<x.length;i++)
    {
        if(x[i]=='1')
        {
			connection.query('select * from attendance where rollno=? and TID=? and date=?',[rec[i].rollno,req.session.username,date],(err,data)=>{
			 if(err)
			 throw err;
		      if(data.length==0)
             {  connection.query('insert into attendance values (?,?,?)',[rec[i].rollno,date,req.session.username],(err,result)=>{
                    
                 if(err)
                 throw err;
			    });
		     }
		  });
        }
    }
    res.redirect('/take');
});

//student login function
app.post('/authst', function(request, response) {
	var username = request.body.Username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM student WHERE rollno = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				ath=3;
				response.redirect('/studentm');
			} else {
				response.render('studentlogin.ejs',{str: 'Incorrect Username and/or Password!'});
			}			
			response.end();
		});
	} else {
		response.render('studentlogin.ejs',{str: 'Please enter Username and Password!'});
		response.end();
	}
});

//faculty login function
app.post('/authft', function(request, response) {
	var username = request.body.Username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM faculty WHERE TID = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				ath=2;
				response.redirect('/facultym');
			} else {
				response.render('facultylogin.ejs',{str: 'Incorrect Username and/or Password!'});
			}			
			response.end();
		});
	} else {
		response.render('facultylogin.ejs',{str: 'Please enter Username and Password!'});
		response.end();
	}
});

//admin login function
app.post('/authad', function(request, response) {
	var username = request.body.Username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM admin WHERE AID = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				ath=1;
				response.redirect('/adminm');
			} else {
				response.render('adminlogin.ejs',{str: 'Incorrect Username and/or Password!'});
			}			
			response.end();
		});
	} else {
		response.render('adminlogin.ejs',{str: 'Please enter Username and Password!'});
		response.end();
	}
});

app.get('/studentm', function(request, response) {
	if (request.session.loggedin && ath==3) {
		response.render('studentmenu.ejs',{username: request.session.username, str:""});
	} else {
		response.redirect('/student');
	}
	response.end();
});

app.get('/facultym', function(request, response) {
	if (request.session.loggedin && ath==2) {
		response.render('facultymenu.ejs',{username: request.session.username, str:""});
	} else {
		response.redirect('/faculty');
	}
	response.end();
});

app.get('/adminm', function(request, response) {
	if (request.session.loggedin && ath==1) {
		response.render('adminmenu.ejs',{username: request.session.username, str:""});
	} else {
		response.redirect('/admin');
	}
	response.end();
});

app.get('/logout', function(req, res, next) {
    if (req.session) {
      req.session.destroy(function(err) {
        if(err) {
          return next(err);
        } else {
			ath=0;
          return res.render('home.ejs');
        }
      });
    }
  });

  app.get('/adds',(req,res)=>{
	if (req.session.loggedin && ath==1)
		res.render('addstudent.ejs',{str: ""});
	else
	res.redirect('/admin');
  });

  app.get('/addf',(req,res)=>{
	if (req.session.loggedin && ath==1)  
	res.render('addfaculty.ejs',{str:""});
	else
	res.redirect('/admin');
});

//function to add student
  app.post('/addst',(req,res)=>{
   connection.query("select * from student where rollno=?",[req.body.rollno],(error,result)=>{
	if(error)
	throw error;
	if(result.length==0)
  { connection.query("insert into student values(?,?,?,?,?,?)",[req.body.rollno,req.body.name,req.body.course,req.body.dob,req.body.password,req.body.sem],(err)=>{
	if(err)
	throw err;
   });
   res.render('adminmenu.ejs',{username: req.session.username,str: "Record Added"});
  } 
 else 
 res.render('addstudent.ejs',{str:"Roll number already exists"});
 });
});

//function to add faculty
app.post('/addft',(req,res)=>{
   
  connection.query("select * from faculty where TID=?",[req.body.tid],(error,result)=>{
   
	if(error)
	  throw error;
	  if(result.length==0)
     {
	   connection.query("insert into faculty values(?,?,?,?)",[req.body.tid,req.body.name,req.body.Dept,req.body.password],(err)=>{
         if(err)
		 throw err;
	});
	var x=req.body.BCSv;
	for(var i=0;i<x.length;i++)
{	
	if(x[i]=='1')
 {	connection.query("insert into teaches values (?,?,?)",[req.body.tid,'BCS',i+1],(err)=>{ 
		 if(err)
		 throw err;
	});
 }
}
var x=req.body.IMTv;
for(var i=0;i<x.length;i++)
{	
if(x[i]=='1')
{	connection.query("insert into teaches values (?,?,?)",[req.body.tid,'IMT',i+1],(err)=>{ 
	 if(err)
	 throw err;
});
}
}
var x=req.body.IMGv;
for(var i=0;i<x.length;i++)
{	

if(x[i]=='1')
{	connection.query("insert into teaches values (?,?,?)",[req.body.tid,'IMG',i+1],(err)=>{ 
	 if(err)
	 throw err;
});
}
}
res.render('adminmenu.ejs',{username: req.session.username,str: "Record Added"});
 }
else
  res.render('addfaculty.ejs',{str:"Record already exists!!"});
});	
});


app.get('/apwd',(req,res)=>{
	if(req.session.loggedin)
	res.render('apwd.ejs',{str: ""});
	else
	res.render('adminlogin',{str:""});
});

//function to change password
app.post('/chapwd',(req,res)=>{
	if(ath==1) {
	connection.query("select password from admin where AID=?",[req.session.username],(err,data)=>{
		if(err)
		throw err;
		if(req.body.oldpassword==data[0].password)
		{
			connection.query('update admin set password=? where AID=?',[req.body.newpassword, req.session.username],(error)=>{
				if(error)
				throw error;
				res.render('adminlogin.ejs',{str:"Password Changed Login again"});
			});
		}
		else
		res.render('apwd.ejs',{str: "Old password is wrong"});
	});
}

if(ath==2) {
	connection.query("select password from faculty where TID=?",[req.session.username],(err,data)=>{
		if(err)
		throw err;
		if(req.body.oldpassword==data[0].password)
		{
			connection.query('update faculty set password=? where TID=?',[req.body.newpassword,req.session.username],(error)=>{
				if(error)
				throw error;
				res.render('facultylogin.ejs',{str:"Password Changed Login again"});
			});
		}
		else
		res.render('apwd.ejs',{str: "Old password is wrong"});
	});
}

if(ath==3) {
	connection.query("select password from student where rollno=?",[req.session.username],(err,data)=>{
		if(err)
		throw err;
		if(req.body.oldpassword==data[0].password)
		{
			connection.query('update student set password=? where rollno=?',[req.body.newpassword,req.session.username],(error)=>{
				if(error)
				throw error;
				res.render('studentlogin.ejs',{str:"Password Changed Login again"});
			});
		}
		else
		res.render('apwd.ejs',{str: "Old password is wrong"});
	});
}
      
});