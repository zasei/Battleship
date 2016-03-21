var express = require('express');
var app = express();
var uniqid = require('uniqid');
var http = require('http').Server(app);
var io = require('socket.io')(http),
	socket = require('./socket');

var Datastore = require('nedb'),
    rooms = new Datastore();

var port = 3000;
var DEBUG = true;

app.set('views', __dirname + '/../app/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/../bower_components'));
app.use(express.static(__dirname + '/../app/'));

app.locals.pretty = true;

//Get rid of favicon requests
app.use(function(q, r, next) {
	if (q.url !== '/favicon.ico')
    	next();  
});

/* TODO

- Create a new room if a user doesn't join a room
- A user can share the room link to another user and that user can you join the room
- Implement turns
- Optional: Spectate mode
*/

app.get('/:roomName?', function(req, res) {

	var roomName = req.params.roomName;
	var playerId = uniqid();

	rooms.findOne({room: roomName}, function(err, room) {

		if (room != null) {
			console.log(roomName + ' exists');
			if (room.players.length == 1) {
				rooms.update({room: roomName}, {$addToSet : { players: {'id': playerId, 'ready': false, 'takenHits': 0, 'locations' : [] }} }, {}, function(obj) {
						console.log('Player joined a room!');
					});
			}
			else if (room.players.length == 2){
				res.render('progress');
				return;
			}
		} else {

			roomName = uniqid();

			rooms.insert({'room' : roomName, 'players' : [ {'id': playerId,'ready': false, 'takenHits': 0, 'locations' : [] } ]  }, function(err, result) {

			});
		}
		res.render('index', { roomName: roomName });

		socket(io, rooms, {'playerId': playerId, 'roomId': roomName});

	});
	

});

http.listen(port, function() {
	console.log('Listening on port ' + port);
});

