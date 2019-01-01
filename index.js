var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    socket.on('chat message', function (msg) {
        io.emit('chat message', msg);
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});


// If the URL of the socket server is opened in a browser
function handler (request, response) {

    request.addListener('end', function () {
        fileServer.serve(request, response); // this will return the correct file
    });
}
// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {

    // Start listening for mouse move events
    socket.on('mousemove', function (data) {

        // This line sends the event (broadcasts it)
        // to everyone except the originating client.
        socket.broadcast.emit('moving', data);
    });
});