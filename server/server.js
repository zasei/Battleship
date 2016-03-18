var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = 3000;

app.set('views', __dirname + '/../app/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/../bower_components'));
app.use(express.static(__dirname + '/../app/'));

app.locals.pretty = true;


var players = [];


function playerById(id, opponent) {
	opponent = typeof opponent !== 'undefined' ? opponent : false;
	for (var i = 0; i < players.length; i++) {
		if (opponent) {
			if (players[i].id != id) {
				return players[i];
			}
		} else {
			if (players[i].id == id) {
				return players[i];
			}
		}
	}
}

function checkPlayersReady() {
	var ready = true;
	for (var i = 0; i < players.length; i++) {
		if (!players[i].ready)
			ready = false;
	}

	return ready;
}

io.on('connection', function (socket) {

	
	
	if (players.length < 2) {
		var id = socket.id;

		players.push({'id' : id, 'ready': false, 'takenHits': 0, 'locations' : []});
		socket.emit('id', {'id':socket.id, 'playerCount' : players.length, 'players' : players});

		//console.log('lms ' + playerById(socket.id).id);

		//console.log('Player ' + id + ' joined the game');

		socket.broadcast.emit('playerJoined');

		console.log(players);

	} else {
		socket.emit('gameInProgress', true);
	}

	socket.on('ready', function(obj) {
		players[players.indexOf(playerById(socket.id))].locations = obj.locations;
		players[players.indexOf(playerById(socket.id))].ready = true;
		socket.broadcast.emit('opponentReady', true);

		console.log(players[players.indexOf(playerById(socket.id))].locations);
		//console.log(id + ' is ready ' + players[players.indexOf(playerById(socket.id))].ready);

	});

	socket.on('fire', function(cords) {
		if (!checkPlayersReady())
			return;

		console.log(cords);

		var opponent = players[players.indexOf(playerById(socket.id, true))];

		var hit = false;

		for (var i = 0; i < opponent.locations.length; i++) {
			if (opponent.locations[i] == cords) {
				players[players.indexOf(playerById(socket.id, true))].takenHits++;
				hit = true;
			}
		}
		
		socket.emit('hit', {'cords' : cords, 'hit' : hit});


		socket.broadcast.emit('takeFire', cords);

	});

	socket.on('disconnect', function(){
	    players.splice(players.indexOf(playerById(socket.id)), 1);
	    socket.broadcast.emit('opponentLeft');
	});

});

app.get('/', function(req, res) {
	res.render('index');
});

http.listen(port, function() {
	console.log('Listening on port ' + port);
});

