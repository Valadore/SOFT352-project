
$(function () {
    var socket = io();
    //on submiting we join the server
    $('#name').submit(function () {
        if ($('#nameinput').val() != '') {
            socket.emit('joinServer', $('#nameinput').val());
            window.location.href = "#one";
            return false;
        }
    });

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
            document.getElementById(gameRoom).addEventListener("click", function () { reply_click(gameRoom) });
        });
    }
    //this is where we need to redirect
    function reply_click(room) {
        socket.emit('joinGame', room)
    }

    socket.on('joinGame', function () {
        window.location.href = "#two";
        // This demo depends on the canvas element
        if (!('getContext' in document.createElement('canvas'))) {
            alert('Sorry, it looks like your browser does not support canvas!');
            return false;
        }
        //set canvas size
        document.getElementById('paper').width = document.getElementsByClassName("drawing")[0].clientWidth;
        document.getElementById('paper').height = document.getElementsByClassName("drawing")[0].clientHeight;
    });

    socket.on('startRound', function (playerid, word) {
        console.log('Round started');

        var socketid = socket.io.engine.id
        var doc = $(document),
            win = $(window),
            canvas = $('#paper'),
            ctx = canvas[0].getContext('2d'),
            canvasOffset = canvas.offset(),
            offsetX = canvasOffset.left,
            offsetY = canvasOffset.top;

        // Generate an unique ID
        var id = Math.round($.now() * Math.random());

        // A flag for drawing activity
        var drawing = false;

        var clients = {};

        socket.on('moving', function (data) {
            // Is the user drawing?
            if (data.drawing && clients[data.id]) {

                // Draw a line on the canvas. clients[data.id] holds
                // the previous position of this user's mouse pointer
                drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
            }

            // Saving the current client state
            clients[data.id] = data;
            clients[data.id].updated = $.now();
        });
        function drawLine(fromx, fromy, tox, toy) {
            ctx.moveTo(fromx, fromy);
            ctx.lineTo(tox, toy);
            ctx.stroke();
        }

        var prev = {};

        canvas.on('mousedown', function (e) {
            e.preventDefault();
            drawing = true;
            prev.x = e.pageX;
            prev.y = e.pageY;
        });

        doc.bind('mouseup mouseleave', function () {
            drawing = false;
        });

        var lastEmit = $.now();
        if (playerid == socketid) {
            alert('Your word is: ' + word);
            doc.on('mousemove', function (e) {
                if ($.now() - lastEmit > 30) {
                    socket.emit('mousemove', {
                        'x': e.pageX - offsetX,
                        'y': e.pageY - offsetY,
                        'drawing': drawing,
                        'id': id
                    });
                    lastEmit = $.now();
                }
            });
        } else {
            $('#send').submit(function () {
                var mesage = document.getElementById("text")
                socket.emit('send guess', mesage.value, socketid, word);
                $('#text').val('');
                return false;
            });
        }
        socket.on('chat message', function (msg) {
            $('#messages').append($('<li>').text(msg));
        });

    });
});

