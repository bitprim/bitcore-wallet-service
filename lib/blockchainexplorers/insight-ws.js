var log = require('npmlog');

function InsightWebSocketClient(useSocketIo, webSocketsUrl, connectionInfoFunction) {
    this.webSocketsUrl = webSocketsUrl;
    this.connectionInfoFunction = connectionInfoFunction;
    this.initFunction = useSocketIo? socketIoInit : pureWebSocketsInit;
}

function socketIoInit(){
    // sockets always use the first server on the pull
    var io = require('socket.io-client');
    var socket = io.connect(_.first([].concat(this.hosts)), {
        'reconnection': true
    });
    return socket;
}

function pureWebSocketsInit(){
    var WebSocket = require('ws');
    var socket = new WebSocket(this.webSocketsUrl);
    socket.eventsDictionary = [];
    socket.onopen = function() {
        log.info("Web socket connection to bitprim-insight established")
        socket.send("SubscribeToTxs");
        socket.send("SubscribeToBlocks"); 
    };
    socket.onerror = function(error){
        log.error('WebSocket error on ' + connectionInfoFunction() + ': ' + error);
    };
    socket.onmessage = function(msg) {
        var messageData = JSON.parse(msg.data);
        log.info("Web socket message received: " + JSON.stringify(messageData));
        var events = socket.eventsDictionary;
        if(messageData.eventname != undefined && messageData.eventname in events)
        {
            events[messageData.eventname](messageData);
        }
    }
    socket.on = function(eventName, callback) {
        log.info("Handler registered for web socket event: " + eventName);
        socket.eventsDictionary[eventName] = callback;
    }
    return socket;
}

MyObject.prototype.initSocket = function initSocket() {
    return this.initFunction();
};

module.exports = InsightWebSocketClient;
