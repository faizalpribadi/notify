var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    path: '/api/notification'
});
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Promise = require('bluebird');

mongoose.connect('mongodb://localhost/socket');

var NamespaceSchema = new Schema({
    name: {type: String, required: true},
    link: String,
    desc: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

var Namespace = mongoose.model('Namespace', NamespaceSchema);

function FindAll(data) {
    if (!data) {
        data = data || {};
    }

    return new Promise(function(resolve, reject) {
        Namespace.find(data, function(err, value) {
            if (err) {
                reject(err);
            } else {
                resolve(value);
            }
        })
    })
}

function SaveTheData(data) {
    if (typeof data !== 'object') {
        throw new Error('Data must be an object');
    }

    return new Promise(function(resolve, reject) {
        var $namespace = new Namespace(data);
        $namespace.save(function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        })
    })
}

io.sockets.on('connection', function(socket) {

    /**
     * If user loggedIn to the web system
     * broadcast and subscribe to the new post
     *
     * (Dual browsers )
     */

    /**
     * Find all the data
     */
    FindAll().then(function(data) {
        socket.emit('data', data);
    });

    /**
     * Save the data
     */
    socket.on('save', function(data) {
        SaveTheData(data).then(function(value) {
            console.log(value);
        });
        FindAll({name: data.name}).then(function(val) {
            socket.emit('data', val);
        })
    })
});

server.listen(3000);