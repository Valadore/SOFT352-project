$(function () {
    var socket = io('/');
    $('#send').submit(function () {
        var mesage = document.getElementById("text")

        socket.emit('chat message', mesage.value);
        //console.log(message.value)
        $('#text').val('');
        return false;
    });
    socket.on('chat message', function (msg) {
        $('#messages').append($('<li>').text(msg));
    });
});

