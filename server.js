var express = require('express'); //npm install express --save
var jws = require('express-jwt-session'); //npm install express-jwt-session --save
var firebase = require('firebase'); //npm install firebase --save
var admin = require('firebase-admin'); //npm install firebase-admin --save
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer'); //npm install nodemailer --save
var fs = require('fs');
var _ = require('underscore'); //npm install underscore --save


//express config 
var app = express();

app.set('port', (process.env.PORT || 8080));

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
});
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

//firebase config
var serviceAccount = require("./admin/serviceAccountKey.json")
var defaultApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://hourtime-b0cfa.firebaseio.com"
});

var defaultAuth = defaultApp.auth();
var database = defaultApp.database();
var databaseref = database.ref();

//databaseref.child('courses').set('ayy!');


app.post('/api/create_class', function(req, res) {
    var course_name = req.body['course_name'];
    var prof = req.body['prof'];
    var tas = req.body['tas'];

    if (!course_name || !prof || !tas) {
        res.status(400).send(course_name + ", " + prof + ", " + tas);
        return;
    }

    var course = {
        'course_name': course_name,
        'prof': prof,
        'tas': tas
    }

    databaseref.child('courses').push(course);
    res.status(200).send({
        'success': true
    });

});

app.post('/api/add_ta', function(req, res) {
    var course_id = req.body['course_id'];
    var ta = req.body['ta'];

    if (!course_id || !ta) {
        res.status(400).send(course_id + ", " + ta);
        return;
    }

    databaseref.child('courses').child(course_id).child('tas').once('value').then(function(snapshot) {
            if (snapshot.val()) {
                var tas = snapshot.val();
                tas.push(ta);
                databaseref.child('courses').child(course_id).child('tas').set(tas);
                res.status(200).send(tas);
            } else
                res.status(400).send({
                    success: false
                });
        })
        .catch(function(error) {
            res.status(400).send(error);
            console.log(error);
        });

});


app.post('/api/join_class', function(req, res) {
    var course_id = req.body['course_id'];
    var uid = req.body['uid'];

    if (!course_id || !uid) {
        res.status(400).send(course_id + ", " + uid);
        return;
    }

    databaseref.child('courses').child(course_id).child('students').once('value').then(function(snapshot) {
            if (snapshot.val()) {
                var students = snapshot.val();
                students.push(uid);
                databaseref.child('courses').child(course_id).child('students').set(students);
                res.status(200).send({
                    success: true
                });
            } else {
                var students = [uid];
                databaseref.child('courses').child(course_id).child('students').set(students);

                res.status(200).send({
                    success: true
                });
            }
        })
        .catch(function(error) {
            res.status(400).send(error);
            console.log(error);
        });

});


app.get('/api/get_classes', function(req, res) {
    databaseref.child('courses').once('value').then(function(snapshot) {
            if (snapshot.val()) {
                res.status(200).send(snapshot.val());
            } else {
                res.status(200).send({
                    success: true
                });
            }
        })
        .catch(function(error) {
            res.status(400).send(error);
            console.log(error);
        });

});


app.post('/api/create_oh', function(req, res) {
    var time = req.body['time'];
    var course_id = req.body['course_id'];
    var ta_name = req.body['name']
    databaseref.child('courses').child(course_id).child('hours').once('value').then(function(snapshot) {
            if (snapshot.val()) {
                var hours = snapshot.val();
                var offhour = {
                    'time' : time,
                    'ta_name' : ta_name
                }
                
                hours.push(offhour);
                databaseref.child('courses').child(course_id).child('hours').push(offhour);
                res.status(200).send({
                    success: true
                });
            } else {
                var offhour = {
                    'time' : time,
                    'ta_name' : ta_name
                }
                
                var hours = [offhour];
                databaseref.child('courses').child(course_id).child('hours').push(offhour);

                res.status(200).send({
                    success: true
                });
            }
        })
        .catch(function(error) {
            res.status(400).send(error);
            console.log(error);
        });

});


