module.exports = function(Good) {
};

module.exports = function(socket, io){
   socket.on('chat message', function(msg){
   console.log(msg);
    });
}
