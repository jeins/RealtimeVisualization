'use strict';

const fs = require('fs'),
    path = require('path'),
    cron = require('cron'),
    moment = require('moment'),
    faker = require('faker/locale/de'),
    os = require('os'),
    socketIo = require('socket.io'),
    geoip = require('geoip-lite'),
    rest = require('restler'),
     _ = require('lodash');

let filePath, cronJob;

const Processor = function(){
    filePath = path.resolve(__dirname) + '/../public/worker.txt';
};

Processor.prototype = {
    /**
     * run cron job
     */
    runCronJob: ()=>{
        console.log("start cron job to generate random data");
        cronJob = cron.job("*/5 * * * * *", ()=>{
            _writeRandomDataToFile();
        });
        cronJob.start();
    },

    /**
     * waiting if client connect with server and send data via socket
     * @param server
     */
    runSocket: (server)=>{
        let workerData = [];

        socketIo.listen(server).on('connection', (socket)=>{
            cronJob = cron.job("*/3 * * * * *", ()=>{
                let tmpNewWorkerData = [];
                _getWorkerData(tmpNewWorkerData);

                if(tmpNewWorkerData.length != workerData.length){
                    let diff = tmpNewWorkerData.length - workerData.length;
                    let newWorkerData = _generateResponse(_.takeRight(tmpNewWorkerData, diff));

                    console.log("send: " + JSON.stringify(newWorkerData));
                    socket.emit('server.data', newWorkerData);
                    workerData = tmpNewWorkerData;
                }
            });
            cronJob.start();
        });
    }
};

function _getWorkerData(workerData){
    let wData = fs.readFileSync(filePath);
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
        let getRandomLocation = _getRandomDELocation();
        let location = getRandomLocation[Math.floor(Math.random() * (_.size(getRandomLocation)-1))];

        response.worker = data;
        response.worker.latitude = location.latitude;
        response.worker.longitude = location.longitude;
        response.worker.statusPoint = _getWorkerStatusPoint(data.wert);

        response.master = {
            ip: "127.0.0.1",
            name: "Master",
            latitude: 52.5074494,
            longitude: 13.4862395
        };

        response.sendAt = moment().format('YYYY-MM-DD HH:mm:ss');

        arrResponse.push(response);
    });

    return arrResponse;
}

function _getRandomDELocation(){
    return [
        {latitude: 51.9455, longitude: 13.8852},
        {latitude: 52.357756, longitude: 8.032782},
        {latitude: 50.801353, longitude: 8.362372},
        {latitude: 49.349033, longitude: 11.328680},
        {latitude: 49.988955, longitude: 7.747137},
        {latitude: 48.787614, longitude: 8.648016},
        {latitude: 48.584530, longitude: 8.296454},
        {latitude: 48.307606, longitude: 8.296454},
        {latitude: 47.985070, longitude: 7.878973},
        {latitude: 53.444489, longitude: 10.823309},
        {latitude: 53.155600, longitude: 7.637274}
    ]
}

//TODO: need async
function _getLatLonFromIp(ip, getFromApi, cb){
    let location = {
        latitude: faker.address.latitude(),
        longitude: faker.address.longitude()
    };

    if(getFromApi){
        let freeGeoIpUrl = 'http://freegeoip.net/json/?q=' + ip;

        rest.get(freeGeoIpUrl).on('complete', (result)=>{
            if(result instanceof Error){
                console.log('Error: ', result.message);
            } else{
                location.latitude = result.latitude;
                location.longitude = result.longitude;
            }

            cb(location);
        });
    } else{
        let geo = geoip.lookup(data.ip);

        if (_.isEmpty(geo.ll)){
            location.latitude = geo.ll[0];
            location.longitude = geo.ll[1];
        }

        cb(location);
    }

}

function _getWorkerStatusPoint(val){
    let statusPoint = 'draw';

    if(val != 0){
        statusPoint = (val > 0) ? 'win' : 'lost';
    }

    return statusPoint;
}

module.exports = new Processor();