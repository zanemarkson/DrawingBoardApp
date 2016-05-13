
var connection = (function () {
    var ipcRenderer = require('electron').ipcRenderer;
    var randomRoom = require('random-string');
    var port = 23398 ;
    var dest = null ;

    var chooseLocalhost = function(){
        dest = { url: 'http://localhost:23398', room: 'testdraw'};
        ipcRenderer.send('start-localhost', dest);
    };

    var chooseRemotehost = function(){
        var boardurl = 'http://' + document.getElementById('host-url').value + ':' + port ;
        var currentRoom = document.getElementById('channel-name').value ;
        dest = { url: boardurl, room: currentRoom};
        ipcRenderer.send('connect-remote-host', dest);
        console.log(dest);
    };

    this.chooseLocalhost = chooseLocalhost;
    this.chooseRemotehost = chooseRemotehost ;

    return this ;
})();
