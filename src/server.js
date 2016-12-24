var path = require('path');
var Express = require('express');
var engines = require('consolidate');
var mustache = require('mustache');
var mongoose = require('mongoose');
// Utilities for getting/saving messages to MongoDB
var dbUtils = require('./dbUtils');

var app = new Express();

app.set('port', (process.env.PORT || 3000));
app.set('env', (process.env.NODE_ENV || 'production'));
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'static'));
app.engine('html', engines.mustache);
app.use(Express.static(__dirname + '/static'))

var server = require('http').Server(app);
var io = require('socket.io')(server);

var users = [];

//  Socket.io Server Event Handlers
io.on('connection', function(socket) {
    var name;

    socket.on('init', function() {
        name = "User"+(users.length+1).toString();
        users.push(name);
        socket.emit('init', {users: users, name});
        socket.broadcast.emit('user:join', {name: name});
    });

    socket.on('disconnect', function() {
        if(typeof name !== 'undefined'){
            socket.broadcast.emit('user:left', {name: name});
            var index = users.indexOf(name);
            users.splice(index, 1);
        }
    });

    socket.on('send:message', function(message) {
        socket.broadcast.emit('send:message', {
            user: message.user,
            text: message.text
        });
    })
});

// Refactor these out into separate module later

function usernameAvailable(users, newName){
    if(users.indexOf(newName) > -1){
        // Username taken
        return False;
    } else {
        return True;
    }
}

// Chatroom Database Storage
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');
});

// Universal routing and rendering handled by React & react-router
// on the client-side.
app.get('*', function(req, res) {
    res.render('index.html');
});

// start the server (using 'server.listen' for compatibility with socket.io)
server.listen(app.get('port'), function() {
    console.log('[' + app.get('env') + '] Express server listening on port ' + app.get('port'));
});