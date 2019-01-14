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
var gameRooms = [];

io.sockets.on('connection', function (client) {
    client.on("joinServer", function (name) {
        clients[client.id] = {
            id: client.id,
            name: name,
            channel: '/'
        }
    });

    if (gameRooms != '') {
        io.sockets.emit('NewGame', gameRooms);
    }
    client.on('NewGame', function (msg) {
        gameRooms.push(msg);
        io.sockets.emit('NewGame', gameRooms);
    });
    client.on('joinGame', function (room) {
        if (!io.sockets.adapter.rooms[room]) {
            client.join(room);
            clients[client.id].channel = room;
            io.sockets.to(room).emit('joinGame');
        }else if (io.sockets.adapter.rooms[room].length < 2)
        {
            client.join(room);
            clients[client.id].channel = room;
            io.sockets.to(room).emit('joinGame');
            var roomSize = io.sockets.adapter.rooms[room].length;
            if (roomSize == 2) {
                word = generateWord();
                io.sockets.to(room).emit('startRound',client.id, word);
            }
        } 
    });
    
    client.on('send guess', function (msg, id, word) {
        if (msg == word)
        {
            room = clients[client.id].channel;
            word = generateWord();
            io.sockets.to(room).emit('startRound', id, word);
        }
        io.sockets.to(clients[client.id].channel).emit('chat message', clients[client.id].name + ' - ' + msg);
    });


    // Start listening for mouse move events
    client.on('mousemove', function (data) {
        //This line sends the event (broadcasts it)
        //to everyone except the originating client.
        if (clients[client.id]) {
            io.sockets.to(clients[client.id].channel).emit('moving', data);
        }
    });
});
io.sockets.on('disconnect', () => {
    socket.removeAllListeners();
});

function generateWord()
{   
    var words = ['house', 'car', 'cat', 'train'];
    var rand = words[Math.floor(Math.random() * words.length)];
    return rand;
}
