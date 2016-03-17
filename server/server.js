var express = require('express');
var app = express();
var server = require('http').createServer();
var io = require('socket.io')(server);

app.set('views', __dirname + '/../app/views');
app.engine('jade', require('ejs').__express);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/../bower_components'));
app.use(express.static(__dirname + '/../app/js'));

app.locals.pretty = true;

io.on('connection', function (socket) {

});

app.get('/', function(req, res) {
	res.render('index');
});

server.listen(4500);
app.listen(3000);