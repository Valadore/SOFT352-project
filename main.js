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

//initial client conection
io.sockets.on('connection', function (client) {
    //client submits username and is assigned the default channel 
    client.on("joinServer", function (name) {
        clients[client.id] = {
            id: client.id,
            name: name,
            channel: '/'
        }
    });

    //if there are rooms already then draw the list
    if (gameRooms != '') {
        io.sockets.emit('NewGame', gameRooms);
    }
    //client submits a new game, it gets added to the list
    client.on('NewGame', function (msg) {
        gameRooms.push(msg);
        io.sockets.emit('NewGame', gameRooms);
    });
    //client can join a game from a list, if there is space
    client.on('joinGame', function (room) {
        //if there is no one in the room you can join
        if (!io.sockets.adapter.rooms[room]) {
            client.join(room);
            clients[client.id].channel = room;
            io.sockets.to(room).emit('joinGame');
            //if there is less than two people you can join
        } else if (io.sockets.adapter.rooms[room].length < 2) {
            client.join(room);
            clients[client.id].channel = room;
            io.sockets.to(room).emit('joinGame');
            var roomSize = io.sockets.adapter.rooms[room].length;
            //if the room is now full start the game
            if (roomSize == 2) {
                word = generateWord();
                io.of('/').in(room).clients((error, roomClients) => {
                    if (error) throw error;
                    turn = 0;
                    io.sockets.to(room).emit('startRound', roomClients, word, turn);
                });
            }
        }
        //if the game is full laert the client
        else {
            io.to(client.id).emit('full');
        }
    });

    //allows the guessing client to submit a guess
    client.on('send guess', function (msg, word, turn) {
        //if the word matches then swap the player roles and start a new round
        if (msg == word) {
            room = clients[client.id].channel;
            word = generateWord();
            var newturn;
            if (turn == 0) {
                newturn = 1
            } else {
                newturn = 0;
            }
            io.of('/').in(room).clients((error, roomClients) => {
                if (error) throw error;
                turn = 0;
                io.to(client.id).emit('win');
                io.sockets.to(room).emit('startRound', roomClients, word, newturn);
            });
        }
        //if the word dosnt match show it to both players
        io.sockets.to(clients[client.id].channel).emit('chat message', clients[client.id].name + ' - ' + msg);
    });


    // Start listening for mouse move events
    client.on('mousemove', function (data) {
        if (clients[client.id]) {
            io.sockets.to(clients[client.id].channel).emit('moving', data);
        }
    });
});
//handles disconects
io.sockets.on('disconnect', () => {
    socket.removeAllListeners();
});

//selects a random word from a list of words
function generateWord() {
    var words = ['house', 'car', 'cat', 'train', 'horse', 'door', 'song', 'bomb',
        'treasure', 'pirate', 'queen', 'computer', 'plane', 'hotdog', 'key', 'frog',
        'cake', 'bicycle', 'teapot', 'lightbulb'];
    var rand = words[Math.floor(Math.random() * words.length)];
    return rand;
}
