$(function () {
    var socket = io();

    var x = document.getElementById("index");
   // x.style.display='none';

    //on submiting we create a new game room
    $('#game').submit(function () {
        if ($('#m').val() != '') {
            socket.emit('NewGame', $('#m').val());
            $('#m').val('');
            return false;
        }
    });
    //updates the gamerooms list
    socket.on('NewGame', function (gameRooms) {
        buildList(gameRooms);
    });

    //build a list of rooms and add event listener for clicking
    function buildList(gameRooms) {
        var str = '';
        gameRooms.forEach(function (gameRoom) {
            str += '<li>' + gameRoom + '<button id=' + gameRoom + '>Join Game</button>' + '</li>';
        });
        document.getElementById("gameList").innerHTML = str;

        gameRooms.forEach(function (gameRoom) {
            document.getElementById(gameRoom).addEventListener("click", function() { reply_click(gameRoom)});
        });
    }

    //this is where we need to redirect
    function reply_click(room) {
        socket.emit('joinGame', room)
        window.location.href = "#two";
        console.log(room);
    }
});
