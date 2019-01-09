$(function () {
    var socket = io('/game');
    $('#send').submit(function () {
        var mesage = document.getElementById("text")

        socket.emit('chat message', mesage.value);
        //console.log(message.value)
        //$('#m').val('');
       // return false;
    });
    socket.on('chat message', function (msg) {
        $('#messages').append($('<li>').text(msg));
    });
});

