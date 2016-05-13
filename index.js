'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;

var express = require('express'),
    server = express();
// var isServerRunning = false ;
var port = 23398;
var io = null;
var randomRoom = require('random-string');

var newBoard = function () {
    var urlDialog = new BrowserWindow({width: 400, height: 400});
    urlDialog.loadURL('file://' + __dirname + '/partials/urlDialog.html');
    return urlDialog;
};

var initBoard = function (dest) {
    // Create the Main Board Window
    var mainWindow = new BrowserWindow({width: 1700, height: 900});
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
    mainWindow.loadURL(dest.url + '/index.html' + '?room=' + dest.room);
    return mainWindow;
};

app.newBoard = newBoard;
app.initBoard = initBoard;

var currentDialog = null;
var currentBoard = null;
var allBoards = [];


var setupMenu = function () {

    var Menu = electron.Menu;
    var name = app.getName();
    console.log(name);
    var template = [
        {
        label: name,
        submenu: [
            {
                label: 'About ' + name,
                role: 'about'
            },
            {
                type: 'separator'
            },
            {
                label: 'Services',
                role: 'services',
                submenu: []
            },
            {
                type: 'separator'
            },
            {
                label: 'Hide ' + name,
                accelerator: 'Command+H',
                role: 'hide'
            },
            {
                label: 'Hide Others',
                accelerator: 'Command+Alt+H',
                role: 'hideothers'
            },
            {
                label: 'Show All',
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: function () {
                    app.quit();
                }
            }]
        },
        {
        label: 'File',
        submenu: [
            {
                label: 'New Board',
                accelerator: 'CmdOrCtrl+N',
                click: function (item, focusedWindow) {
                    currentDialog = newBoard();
                }
                // click: app.initBoard()

            }]
        }
    ];

    var menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

};


app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();

    }
    else {
        setupMenu();
    }
});


app.on('ready', function () {


    var startApp = function () {

        currentDialog = newBoard();
        setupMenu();
        var thisServer = null;

        ipcMain.on('new-board', function (event, arg) {
            currentDialog = newBoard();
        });

        ipcMain.on('start-localhost', function (event, arg) {

            //setupMenu();

            var BoardURL;
            var thisRoom;

            // Server-side API

            var secret = 'fullstack';

            if (!thisServer) {
                thisServer = server.listen(port);
                io = require('socket.io').listen(thisServer);
                server.use('/index.html', function (req, res, next) {
                    thisRoom = req.query.room || randomRoom({length: 7}); // If accessed from browser, the value of
                                                                          // thisRoom will NOT be over-written by frontend// although console.log will say room is "null"
                    console.log('Connect in Room:' + thisRoom);
                    next();
                }); // This part ensure that if ?room= is specified, user is directly connected to that room.
                server.use(express.static(__dirname + '/'));
                io.on('connection', function (socket) {

                    socket.on('load', function (data) {
                        console.log('User from ' + socket.handshake.address + ' just joined ... channel = ' + (data.room || thisRoom));
                        console.log(data);

                        if (data.key === secret) {
                            var oldRoom = thisRoom;
                            thisRoom = data.room || thisRoom || randomRoom({length: 7});
                            socket.emit('access', {
                                access: "granted",
                                room: thisRoom
                            });
                            socket.leave(oldRoom);
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
            }


            BoardURL = arg.url;
            console.log('Drawing Board Server is running on ' + BoardURL);
            console.log('Channel is ' + arg.room);

            currentBoard = initBoard(arg);
            currentBoard.on('closed', function () {
                allBoards.pop(currentBoard);
            });
            allBoards.push(currentBoard);

            currentDialog.close();
            currentDialog = null;


        });

        ipcMain.on('connect-remote-host', function (event, arg) {

            // setupMenu();

            var BoardURL;
            BoardURL = arg.url;
            console.log(arg);
            console.log('Drawing Board Server is running on' + BoardURL);
            console.log('Channel is ' + arg.room);

            currentBoard = initBoard(arg);
            currentBoard.on('closed', function () {
                allBoards.pop(currentBoard);
            });
            allBoards.push(currentBoard);

            currentDialog.close();
            currentDialog = null;

        });


    };

    startApp();

    // setTimeout(newBoard(), 1000);


});

// var startApp = function () {

