module.exports = function (Good) {

};

module.exports = function (Good, socket) {
    var app = require('../../server/server');

    //check whether socket had defined on the server js
    if (typeof (socket) != 'undefined') {
        
        //when getAllGood event is triggered, do something
        socket.on('getAllGood', function (data) {
            //find all goods
            Good.find({limit: 20, skip: 0},function (error, result) {
                //triger 'goods' event & pass all goods data
                socket.emit('goods', result);
            })
        });
        
        socket.on('searchGood', function (data, fn) {

            var pattern = new RegExp('.*' + data[2] + '.*', "i"); /* case-insensitive RegExp search */
            //find goods by name
            Good.find({ where: { name: { like: pattern } }, limit:data[0], skip:data[1]}, function (error, result) {
                Good.count({ name: { like: pattern }}, function(error, countResult){
                    var resultJson = {};
                    resultJson.results = result;
                    resultJson.count = countResult;
                    fn(resultJson);
                })
                
            })
        });
        
        socket.on('getGood', function(data, fn){
           Good.find({limit: data[0], skip: data[1]},function (error, result) {
                //trigger 'good' event & pass all goods data
                fn(result);
            }) 
        });


        Good.beforeRemote('**', function (context, goodInstance, next) {
            context.req.body.lastUpdated = new Date();
            next();
        })

        //go to after remote function when user do Create, Update & delete good.
        Good.afterRemote('**', function (context, goodInstance, next) {
                //trigger 'good' event & pass all goods data
                socket.emit('goods-changed', context.result.__data);
                next();
        });
    }

}
