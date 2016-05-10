'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;
// var mainWindow = null;

var express = require('express'),
    server = express(),
    isServerRunning = false ;
var port = 8080;
var io = null;
var randomRoom = require('random-string');

var startApp = null;


app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});


app.on('ready', function () {

    startApp = function () {

        var urlDialog = new BrowserWindow({ width: 400, height: 400 });
        urlDialog.loadURL('file://' + __dirname + '/partials/urlDialog.html');
        // urlDialog.webContents.openDevTools();

        ipcMain.on('start-localhost', function (event, arg) {

            var BoardURL;
            var thisRoom ;

            // Server-side API

            var secret = 'fullstack';

            io = require('socket.io').listen(server.listen(port));
            server.use('/index.html', function(req, res, next) {
                thisRoom = req.query.room || randomRoom({ length: 7 });
                console.log('Connect in Room:' + thisRoom );
                next();
            });
            server.use(express.static(__dirname + '/'));
            io.on('connection', function (socket) {
               
                socket.on('load', function (data) {
                    console.log('User from ' + socket.handshake.address + ' just joined ... channel = ' + data.room );
                    console.log(data);

                    if (data.key === secret) {
                        thisRoom = data.room || thisRoom || randomRoom({ length: 7 });
                        socket.emit('access', {
                            access: "granted",
                            room: thisRoom
                        });
                        socket.join(thisRoom);
                    }
                    else {
                        socket.emit('access', {
                            access: "denied",
                            room: "black-hole"
                        });
                    }
                });

                socket.on('mouse-positioning', function (data) {
                    if (data.key === secret) {
                        // Tell all connected clients to navigate to the new slide
                        console.log(data);
                        io.in(data.room).emit('get-to-position', data);
                    }
                });

                socket.on('mouse-drawing', function (data) {
                    if (data.key === secret) {
                        // Tell all connected clients to navigate to the new slide
                        //console.log(data);
                        io.in(data.room).emit('keep-drawing', data);
                    }
                });

                socket.on('mouse-clearing', function (data) {
                    if (data.key === secret) {
                        // Tell all connected clients to navigate to the new slide
                        io.in(data.room).emit('keep-clearing', data);
                    }
                });

                socket.on('all-clear', function (data) {
                    if (data.key === secret) {
                        // Tell all connected clients to navigate to the new slide
                        io.in(data.room).emit('clear-drawing');
                    }
                });

                socket.on('disconnect', function () {
                    console.log('User from ' + socket.handshake.address + ' just disconnected ...');
                });

            });

            BoardURL = arg.url;
            console.log('Drawing Board Server is running on ' + BoardURL );
            console.log('Channel is ' + arg.room);
            urlDialog.close();
            initBoard(arg);

        });

        ipcMain.on('connect-remote-host', function (event, arg) {

            var BoardURL;

            BoardURL = arg.url;
            console.log(arg);
            console.log('Drawing Board Server is running on' + BoardURL);
            console.log('Channel is ' + arg.room);
            urlDialog.close();
            initBoard(arg);
        });

        var initBoard = function (dest) {
            // Create the Main Board Window
            var mainWindow = new BrowserWindow({ width: 1600, height: 900 });
            mainWindow.on('closed', function () {
                mainWindow = null;
            });
            // mainWindow.webContents.openDevTools();

            // and load the index.html of the app.
            mainWindow.loadURL(dest.url + '/index.html' + '?room=' + dest.room);
        };


    };

    startApp();

    // setTimeout(startApp(), 1000);




});

// var startApp = function () {

