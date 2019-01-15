
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
    $('#gameName').submit(function () {
        if ($('#gameText').val() != '') {
            socket.emit('NewGame', $('#gameText').val());
            $('#gameText').val('');
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
            str += '<li>  ' + gameRoom + '  <button id=' + gameRoom + '>Join Game</button>' + '  </li>';
        });
        document.getElementById("gameList").innerHTML = str;

        gameRooms.forEach(function (gameRoom) {
            document.getElementById(gameRoom).addEventListener("click", function () { reply_click(gameRoom) });
        });
    }
    //when a client clicks on a game room
    function reply_click(room) {
        socket.emit('joinGame', room)
    }

    //if the game room is full
    socket.on('full', function () {
        alert('Game is full');
    });

    //on joining a game the html page is updated and the game checks that canvas is supported
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

    var word;
    var turn;
    myTurn = false;

    //when a round is started
    socket.on('startRound', function (playerids, guessword, turntemp) {
        //clear the previus guesses
        $('#messages').html("");
        var id = socket.io.engine.id
        word = guessword;
        turn = turntemp;

        //if it is this clients turn to draw
        if (id == playerids[turn]) {
            //we change the text at the top of the screen
            $('#header').html("");
            $('#header').append('<p style="font-size:200%; text-align:center"> You are drawing: ' + word + '</p>');
            //alert the player to the word
            alert('Your word is: ' + word);
            //set myTurn to true
            myTurn = true;
            //and call the draw function
            draw(id);
        }
        //else if it is the turn to guess
        else {
            //set the text at the top of the screen
            $('#header').html("");
            $('#header').append('<p style="font-size:200%; text-align:center">You are guessing</p>');
            //and set myturn to false
            myTurn = false;
        }
        //set canvas size(also clears the canvas)
        document.getElementById('paper').width = document.getElementsByClassName("drawing")[0].clientWidth;
        document.getElementById('paper').height = document.getElementsByClassName("drawing")[0].clientHeight;
    });

    var doc = $(document),
        win = $(window),
        canvas = $('#paper'),
        ctx = canvas[0].getContext('2d');

    var clients = {};

    //if a player is currently drawing
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
    //fucntion to draw the lines
    function drawLine(fromx, fromy, tox, toy) {
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
    }

    //this function captures the players drawing and sends it back to the server
    function draw(id) {

        canvasOffset = canvas.offset(),
            offsetX = canvasOffset.left,
            offsetY = canvasOffset.top;
        // A flag for drawing activity
        var drawing = false;
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

        //using lastEmit to limmit the data rate
        var lastEmit = $.now();
        doc.on('mousemove', function (e) {
            if (myTurn) {
                if ($.now() - lastEmit > 30) {
                    socket.emit('mousemove', {
                        'x': e.pageX - offsetX,
                        'y': e.pageY - offsetY,
                        'drawing': drawing,
                        'id': id
                    });
                    lastEmit = $.now();
                }
            }
        });
    }
    //if it is the players guessing turn they can submit guesses
    $('#send').submit(function () {
        if (!myTurn) {
            var mesage = document.getElementById("text")
            socket.emit('send guess', mesage.value, word, turn);
            $('#text').val('');
            return false;
        }
    });

    //recives messages from the server
    socket.on('chat message', function (msg) {
        $('#messages').append($('<li>').text(msg));
    });
    //if the player wins they are notified
    socket.on('win', function () {
        alert('Congradulations, you guessed correctly!');
    });
});

