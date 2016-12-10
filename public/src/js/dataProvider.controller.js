'use strict';

function DataProvider(action){
    this.action = action;

    this.socket = io.connect('ws://localhost:8888/'); //TODO:: need to be set on config
}

DataProvider.prototype.run = function(){
    var me = this;

    this.socket.on('server.data', function (dataSet) {
        console.log(dataSet);
        me.update(dataSet);
    });
};

DataProvider.prototype.update = function(dataSet){
    var me = this;
    dataSet.forEach(function(data){
        me.action.shoot(data);
    })
};