module.exports = function(io, rooms, obj) {

	function playersReady(room) {
		rooms.findOne({"room": room }, function(err, res) {

			var ready = true;

			for (var i = 0; i < res.players.length; i++) {
				if (!res.players[i].ready)
					ready = false;
			}

			return ready;
		});
	}

	io.on('connection', function (socket) {


		console.log('emit to room ' + obj.roomId);

		socket.join(obj.roomId);

		socket.broadcast.to(obj.roomId).emit('playerJoined');

		socket.id = obj.playerId;

		// rooms.find({}, function(err, res) {
		// 	console.log(res);
		// });

		rooms.findOne({"players.id": socket.id }, function(err, res) {

			if (res != null) {
				console.log(res.players);
				socket.emit('init', {'players': res.players, 'id': socket.id, 'room': obj.roomId});
			}
			

		});

		socket.on('ready', function(obj) {

			console.log("READY " + obj.playerState.room);

			// Unfortunately this approach doesn't work in nedb.
			// rooms.update( {"players.id": obj.playerState.id}, {$set: {"players.$.ready": true, "players.$.locations": obj.locations}}, function(err, nchanged) { });

			socket.broadcast.to(obj.room).emit('opponentReady', true);

			console.log(nchanged);

			rooms.findOne({room: obj.playerState.room}, function(err, res) {
				console.log(res.players);
			});

		});

		socket.on('fire', function(cords) {

			if (!playersReady(obj.roomId))
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

			socket.broadcast.to(obj.roomId).emit('opponentLeft');

			rooms.findOne({"players.id": socket.id}, function(err, res) {

				if (res != null) {

					if (res.players.length == 1) {
						rooms.remove({"players.id": socket.id}, function(err, nr) {

						});
					} else {
						rooms.update({"players.id": socket.id}, {$pull: {"players" : {id: socket.id}}}, function(err, res) {

						});
					}
				}

			});
		    // players.splice(players.indexOf(playerById(socket.id)), 1);
		    // 
		});

	});
}