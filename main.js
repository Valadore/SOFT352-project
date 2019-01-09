var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);

app.use(express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/game-room.html');
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

var clients = [];

io.sockets.on('connect', function (client) {
    clients.push(client);

    client.on('disconnect', function () {
        clients.splice(clients.indexOf(client), 1);
    });
});

var gameRooms = [];

var index = io.of('/');
index.on('connection', function (socket) {
    if (gameRooms != ''){
    index.emit('NewGame', gameRooms);
    }
    socket.on('NewGame', function (msg) {
        gameRooms.push(msg);
        index.emit('NewGame', gameRooms);
    });
    socket.on('joinGame', function (room){
        
    });
});

var game = io.of('/game')

game.on('connection', function (socket) {
    socket.on('chat message', function (msg) {
        game.emit('chat message', msg);
    });
    // Start listening for mouse move events
    socket.on('mousemove', function (data) {
        // This line sends the event (broadcasts it)
        // to everyone except the originating client.
        game.emit('moving', data);
    });
});

