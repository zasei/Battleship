var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = 3000;

app.set('views', __dirname + '/../app/views');
app.engine('jade', require('ejs').__express);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/../bower_components'));
app.use(express.static(__dirname + '/../app/'));

app.locals.pretty = true;


var players = [];

io.on('connection', function (socket) {

	if (players.length < 2) {
		var id = socket.id;

		players.push({'id' : id, 'ready': false, 'takenHits': 0});
		socket.emit('id', {'id':socket.id, 'pcount' : players.length});

		console.log('Player ' + id + ' joined the game');
		

	} else {
		socket.emit('gameInProgress', true);
	}

	console.log(players.length);

	socket.on('ready', function(id) {
		players.indexOf(playerById(id)).ready = true;
		//io.sockets.emit('opponentReady', true);
		socket.broadcast.emit('opponentReady', true);

		console.log(id + ' is ready ' + players.indexOf(playerById(id)).ready);

	});

	socket.on('disconnect', function(){
	    players.splice(playerById(socket.id), 1);
	});

});

app.get('/', function(req, res) {
	res.render('index');
});

http.listen(port, function() {
	console.log('Listening on port ' + port);
});

function playerById(id) {
	players.forEach(function(e, i) {
		if(e.id == id)
			return e;
	});
}