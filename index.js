'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const ipcMain = require('electron').ipcMain;
// var mainWindow = null;

var express = require('express'),
    server = express();
var port = process.env.PORT || 8080;
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
        var BoardURL;
        var urlDialog = new BrowserWindow({ width: 400, height: 300 });
        urlDialog.loadURL('file://' + __dirname + '/partials/urlDialog.html');
        // urlDialog.webContents.openDevTools();

        ipcMain.on('start-localhost', function (event, arg) {
            // Server-side logic
            server.use(express.static(__dirname + '/'));
            var secret = 'fullstack';
            io = require('socket.io').listen(server.listen(port));
            io.on('connection', function (socket) {
                socket.on('load', function (data) {
                    console.log('User from ' + socket.handshake.address + ' just joined ...');
                    console.log(data);

                    if (data.key === secret) {
                        var thisRoom = data.room || randomRoom({ length: 7 });
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
                        console.log(data);
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

            BoardURL = 'http://localhost:' + port;
            console.log('Drawing Board Server is running on http://localhost:' + port);
            urlDialog.close();
            initBoard(BoardURL);

        });

        ipcMain.on('connect-remote-host', function (event, arg) {
            BoardURL = arg;
            console.log(arg);
            console.log('Drawing Board Server is running on' + BoardURL);
            urlDialog.close();
            initBoard(BoardURL);
        });



        var initBoard = function (url) {
            // Create the Main Board Window
            var mainWindow = new BrowserWindow({ width: 2100, height: 1200 });
            mainWindow.on('closed', function () {
                mainWindow = null;
            });
            mainWindow.webContents.openDevTools();

            // and load the index.html of the app.
            mainWindow.loadURL(url + '/index.html');
        };


    };

    startApp();




});

// var startApp = function () {

