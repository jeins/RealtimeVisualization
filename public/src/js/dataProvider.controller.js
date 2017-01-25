'use strict';

function DataProvider(action, map){
    this.action = action;
    this.map = map;

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
        // me.map.setMasterLocation(data.master.latitude, data.master.longitude);
        me.map.setWorkerLocation(data.worker.latitude, data.worker.longitude, data.worker.statusPoint);
        me.action.shoot(data);
    })
};