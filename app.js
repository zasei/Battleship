var express = require('express');
var app = express();
var http = require('http').Server(app);

var Datastore = require('nedb'),
    rooms = new Datastore();
var io = require('./sockets').listen(http, rooms);

var port = 3000;
var DEBUG = true;

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/public/'));

app.locals.pretty = true;

app.get('/:room?', function(req, res) {
    res.render('index');
});

http.listen(port, function() {
	console.log('Listening on port ' + port);
});

