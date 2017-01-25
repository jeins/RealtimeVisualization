'use strict';

const fs = require('fs'),
    cron = require('cron'),
    moment = require('moment'),
    faker = require('faker'),
    os = require('os'),
    socketIo = require('socket.io'),
     _ = require('lodash');

let filePath, cronJob;

const Processor = function(){
    filePath = 'public/worker.txt';
    cronJob = cron.job("*/1 * * * * *", ()=>{
        _writeRandomDataToFile();
    });
};

Processor.prototype = {
    /**
     * run cron job
     */
    runCronJob: ()=>{
        console.log("Start CronJob");
        cronJob.start();
    },

    /**
     * waiting if client connect with server and send data via socket
     * @param server
     */
    runSocket: (server)=>{
        let workerData = [];

        socketIo.listen(server).on('connection', (socket)=>{
            cronJob = cron.job("*/2 * * * * *", ()=>{
                let tmpNewWorkerData = [];
                _getWorkerData(tmpNewWorkerData);

                if(tmpNewWorkerData.length != workerData.length){
                    let diff = tmpNewWorkerData.length - workerData.length;
                    let newWorkerData = _generateResponse(_.takeRight(tmpNewWorkerData, diff));

                    console.log("send: " + JSON.stringify(newWorkerData));
                    socket.broadcast.emit('server.data', newWorkerData);
                    workerData = tmpNewWorkerData;
                }
            });
            cronJob.start();
        });
    }
};

function _getWorkerData(workerData){
    let wData = fs.readFileSync('public/worker.txt');
    let tmpSplitLine = wData.toString().split(os.EOL);

    _.forEach(tmpSplitLine, (value, index)=>{
        if(index != 0){
            let tmpSplitKey = tmpSplitLine[0].split(';');
            let tmpSplitData = value.split(';');
            let tmpData = {};

            _.forEach(tmpSplitData, (val, i)=>{
                if(val != "") tmpData[tmpSplitKey[i]] = val;
            });

            if(!_.isEmpty(tmpData)) workerData.push(tmpData);
        }
    });
}

function _writeRandomDataToFile(){
    _checkIfHeaderExist();

    let randomValue =   faker.internet.ip() + ';' +
        faker.internet.domainName() + ';' +
        Number(Math.floor(Math.random() * 20) - 10) + ';' +
        moment().format('YYYY-MM-DD HH:mm:ss');

    fs.appendFile(filePath, randomValue+ os.EOL, (err)=>{
        if(err) {
            console.error(err);
            throw err;
        }

        console.log('file is updated %s', moment().format('YYYY-MM-DD HH:mm:ss'));
    });
}

function _checkIfHeaderExist(){
    let header = 'ip;namen;wert;date';
    //TODO: need impl
}

function _generateResponse(newWorkerData){
    let arrResponse = [];

    _.forEach(newWorkerData, (data)=>{
        let response = {};

        response.worker = data;
        response.worker.latitude = faker.address.latitude();
        response.worker.longitude = faker.address.longitude();
        response.worker.statusPoint = _getWorkerStatusPoint(data.wert);

        response.master = {
            ip: "127.0.0.1",
            name: "Master",
            latitude: 52.5074494,
            longitude: 13.4862395
        };

        arrResponse.push(response);
    });

    return arrResponse;
}

function _getWorkerStatusPoint(val){
    let statusPoint = 'draw';

    if(val != 0){
        statusPoint = (val > 0) ? 'win' : 'lost';
    }

    return statusPoint;
}

module.exports = new Processor();