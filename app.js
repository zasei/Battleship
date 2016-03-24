var express = require('express');
var app = express();
var uniqid = require('uniqid');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var url = require('url');

var Datastore = require('nedb'),
    rooms = new Datastore();

var port = 3000;
var DEBUG = true;

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/public/'));


app.locals.pretty = true;

var playersReady = function(id, callback) {

    rooms.findOne({"players.id": id }, function(err, res) {

            var ready = true;

            for (var i = 0; i < res.players.length; i++) {
                if (!res.players[i].ready)
                    ready = false;
            }

            callback(ready);
        });
};

app.get('/:roomName?', function(req, res) {
    res.render('index');
});

var updatePlayer = function(id, obj, callback) {

    var updatedPlayers = [];

    rooms.findOne({"players.id": id}, function(err, res) {

        for(var i = 0; i < res.players.length; i++) {

            if (res.players[i].id == id)
                updatedPlayers.push(obj);
            else
                updatedPlayers.push(res.players[i]);

        }

        callback(updatedPlayers);

    });

};

io.on('connection', function (socket) {

    socket.on('init', function(roomName) {

            console.log(roomName);

            rooms.findOne({room: roomName}, function(err, room) {

                var playerState;

                // check if the room exists
                if (room != null) {

                    //console.log(room.players);
                    playerState = { 'players': room.players, 'id': socket.id, 'room': roomName };
                    

                    // add a player to the room
                    if (room.players.length == 1) {

                        playerState.players.push({'id': socket.id, 'ready': false, 'takenHits': 0, 'locations' : [] });

                        rooms.update({room: roomName}, {$addToSet : { players: {'id': socket.id, 'ready': false, 'takenHits': 0, 'locations' : [] } } }, {}, function(obj, nch) {
                                                              
                        });

                    }
                    else if (room.players.length == 2){
                        return;
                    }
                // the room does not exist, create the room
                } else {
                    roomName = uniqid();

                    playerState =  { 'players': [ {'id': socket.id,'ready': false, 'takenHits': 0, 'locations' : [] } ], 'id': socket.id, 'room': roomName };

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

            if (bothReady) {
                var chooseRandomPlayer = res.players[~~(Math.random() * 2)];
                if (chooseRandomPlayer.id == socket.id) {
                    socket.emit('canFire');
                } else {
                    socket.broadcast.to(chooseRandomPlayer.id).emit('canFire');
                }                
            }

        });

        
        

    });

    socket.on('fire', function(obj) {


        playersReady(socket.id, function(ready) {

            if (ready) {
                //console.log(obj.cords);

                rooms.findOne({"players.id": socket.id} ,function(err, res) {

                    console.log(res);

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

                        console.log(opponent.id + ' TOOK A HIT');

                        updatePlayer(opponent.id, opponent, function(updatedPlayers) {

                            rooms.update({ "players.id": socket.id}, { $set: { players: updatedPlayers } }, function (err, numReplaced) {
                            });

                        });
                    } else {
                        socket.broadcast.to(opponent.id).emit('canFire');
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

                socket.leave(res.room);

                socket.broadcast.to(res.room).emit('opponentLeft')

                if (res.players.length == 1) {
                    rooms.remove({"players.id": socket.id}, function(err, nr) {

                    });
                } else {
                    rooms.update({"players.id": socket.id}, {$pull: {"players" : {id: socket.id}}}, function(err, res) {});
                }
            }

        });
    });

    

});

http.listen(port, function() {

	console.log('Listening on port ' + port);
});

