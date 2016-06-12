module.exports = function (Good) {

};
var sc;

module.exports = function (Good, socket) {
    var app = require('../../server/server');

    //check whether socket had defined on the server js
    if (typeof (socket) != 'undefined') {
        //when getAllGood event is triggered, do something
        socket.on('getAllGood', function (data) {
            //find all goods
            Good.find(function (error, result) {
                //triger 'goods' event & pass all goods data
                socket.emit('goods',result);
            })
        });

        Good.beforeRemote('**', function(context, goodInstance, next){
            context.req.body.lastUpdated = new Date();
            next();
        })

        //go to after remote function when user do Create, Update & delete good.
        Good.afterRemote('**', function (context, goodInstance, next) {
            //find all good
            Good.find(function (error, result) {
                //trigger 'good' event & pass all goods data
                socket.emit('goods',result);
                next();
            })
        });
    }

}
