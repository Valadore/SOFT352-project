$(function () {

    // This demo depends on the canvas element
    if (!('getContext' in document.createElement('canvas'))) {
        alert('Sorry, it looks like your browser does not support canvas!');
        return false;
    }

    // The URL of your web server (the port is set in app.js)
    var url = 'http://localhost:3000';

    var doc = $(document),
        win = $(window),
        canvas = $('#paper'),
        ctx = canvas[0].getContext('2d'),
        canvasOffset = canvas.offset(),
        offsetX = canvasOffset.left,
        offsetY = canvasOffset.top;

    //set canvas size
    document.getElementById('paper').width = document.getElementsByClassName("drawing")[0].clientWidth;
    document.getElementById('paper').height = document.getElementsByClassName("drawing")[0].clientHeight;

    // Generate an unique ID
    var id = Math.round($.now() * Math.random());

    // A flag for drawing activity
    var drawing = false;

    var clients = {};

    var socket = io.connect(url);

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

    function drawLine(fromx, fromy, tox, toy) {
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
    }

});