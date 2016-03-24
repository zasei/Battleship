var socketio = require('socket.io');
var uniqid = require('uniqid');

module.exports.listen = function(http, rooms) {

    /*
        unfortunately nedb doesn't support the positional operator,
        so in order to update an object inside an array we can call this function.
    */
    var updatePlayer = function(id, obj, callback) {

        var updatedPlayers = [];

        rooms.findOne({"players.id": id}, function(err, res) {

            for(var i = 0; i < res.players.length; i++) {

                if (res.players[i].id == id)
                    updatedPlayers.push(obj); // if the player we are looking for matches, push the updated player to the array
                else
                    updatedPlayers.push(res.players[i]); // not the player we are looking for, keep that player intact

            }

            callback(updatedPlayers);

        });

    };

    var playersReady = function(id, callback) {

        rooms.findOne({"players.id": id }, function(err, res) {

            // players can only be ready when there are 2 player in the room
            if (res.players.length != 2) {
                callback(false);
                return;
            }

            var ready = true;
            
            // if there are 2 players and one of them is not ready set ready to false
            for (var i = 0; i < res.players.length; i++)
                if (!res.players[i].ready)
                    ready = false;

            callback(ready);
        });
    };

    io = socketio.listen(http);

    io.on('connection', function (socket) {

        socket.on('init', function(roomName) {

                // find the room that the client sent to us
                rooms.findOne({room: roomName}, function(err, room) {

                    var playerState;

                    // check if the room exists
                    if (room != null) {

                        // set the initial playerState
                        playerState = { 'players': room.players, 'id': socket.id, 'room': roomName };

                        if (room.players.length == 1) {

                            // add the current player to the playerstate's players
                            playerState.players.push({'id': socket.id, 'ready': false, 'takenHits': 0, 'locations' : [] });

                            // add the current player to players
                            rooms.update({room: roomName}, {$addToSet : { players: {'id': socket.id, 'ready': false, 'takenHits': 0, 'locations' : [] } } }, {}, function(obj, nch) {
                                                                  
                            });

                        }
                        // if the room is full, prevent another player from joining the room
                        else if (room.players.length == 2){
                            return;
                        }
                    } else { // room does not exist

                        //generate an unique roomname
                        roomName = uniqid();

                        // create a new player state
                        playerState =  { 'players': [ {'id': socket.id,'ready': false, 'takenHits': 0, 'locations' : [] } ], 'id': socket.id, 'room': roomName };

                        // create the room and insert the first player (host)
                        rooms.insert({'room' : roomName, 'players' : [ {'id': socket.id,'ready': false, 'takenHits': 0, 'locations' : [] } ]  }, function(err, result) {
                                            
                        });
                    }

                    socket.join(roomName);
                    socket.broadcast.to(roomName).emit('playerJoined');
                    socket.emit('init', playerState);
                

            });

        });

        socket.on('ready', function(obj) {

            rooms.findOne({room: obj.playerState.room}, function(err, res) {

                var updatedPlayers = [];
                var bothReady = true;


                for (var i = 0; i < res.players.length; i++) {

                    var p = res.players[i];

                    if (p.id == obj.playerState.id) {
                        p.ready = true;
                        p.locations = obj.locations;
                    }

                    if (!p.ready || res.players.length != 2)
                        bothReady = false;

                    updatedPlayers.push(p);

                }

                rooms.update({ room: obj.playerState.room}, { $set: { players: updatedPlayers } }, function (err, numReplaced) {

                    rooms.findOne({room: obj.playerState.room}, function(err, res) {
                        console.log(res.players);
                    });

                });

                socket.broadcast.to(obj.playerState.room).emit('opponentReady');

                // Randomly select a player to fire first
                if (bothReady) {
                    var chooseRandomPlayer = res.players[~~(Math.random() * 2)];
                    io.sockets.in(res.room).emit('canFire', chooseRandomPlayer);           
                }

            });

            
            

        });

        socket.on('fire', function(obj) {

            playersReady(socket.id, function(ready) {

                if (ready) {

                    rooms.findOne({"players.id": socket.id} ,function(err, res) {

                        var hit = false;
                        var opponent;

                        for (var i = 0; i < res.players.length; i++) {

                            if (res.players[i].id != socket.id) {

                                opponent = res.players[i];

                                for (var n = 0; n < res.players[i].locations.length; n++)

                                    if (res.players[i].locations[n] == obj.cords)
                                        hit = true;

                            }

                        }

                        if(hit) {
                            opponent.takenHits++;

                            updatePlayer(opponent.id, opponent, function(updatedPlayers) {

                                rooms.update({ "players.id": socket.id}, { $set: { players: updatedPlayers } }, function (err, numReplaced) {
                                });

                            });
                        } else {
                            io.sockets.in(res.room).emit('canFire', opponent);
                            // socket.broadcast.to(opponent.id).emit('canFire', true);
                            // socket.emit('canFire', false)
                        }

                        socket.broadcast.to(res.room).emit('takeFire', { 'cords' : obj.cords, 'opponent': opponent});
                        socket.emit('hit', {'cords' : obj.cords, 'hit' : hit});

                    });
                }

            });

        });

        socket.on('disconnect', function(){

            rooms.findOne({"players.id": socket.id}, function(err, res) {

                if (res != null) {

                    var room = res.room;

                    socket.leave(res.room);

                    socket.broadcast.to(res.room).emit('opponentLeft')

                    if (res.players.length == 1) {

                        rooms.remove({"players.id": socket.id}, function(err, nr) {

                        });
                    } else {

                        rooms.update({"players.id": socket.id}, {$pull: {"players" : {id: socket.id}}}, function(err, nchanged) {

                            if (err)
                                console.log("Couldn't remove player " + socket.id + " from room " + res.room)

                        });
                    }
                }

            });
        });

    });
    
    return io;

}