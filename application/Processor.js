import fs from 'fs';
import cron from 'cron';
import moment from 'moment';
import faker from 'faker';
import os from 'os';
import socketio from 'socket.io';
import _ from 'lodash';

class Processor{
    constructor(){
        this.filePath = 'public/worker.txt';
        this.cronJob = cron.job("*/3 * * * * *", ()=>{
            this.writeRandomDataToFile();
        });
    }

    runCronJob(){
        console.log("Start CronJob");
        this.cronJob.start();
    }

    runSocket(server){
        let workerData = [];

        socketio.listen(server).on('connection', (socket)=>{
            this.cronJob = cron.job("*/1 * * * * *", ()=>{
                let tmpNewWorkerData = [];
                this._getWorkerData(tmpNewWorkerData);

                if(tmpNewWorkerData.length != workerData.length){
                    let diff = tmpNewWorkerData.length - workerData.length;
                    let newWorkerData = this._generateResponse(_.takeRight(tmpNewWorkerData, diff));

                    console.log("send: " + JSON.stringify(newWorkerData));
                    socket.broadcast.emit('server.data', newWorkerData);
                    workerData = tmpNewWorkerData;
                }
            });
            this.cronJob.start();
        });
    }

    _getWorkerData(workerData){
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

    writeRandomDataToFile(){
        this._checkIfHeaderExist();
        let randomValue =   faker.internet.ip() + ';' +
                            faker.internet.domainName() + ';' +
                            Math.floor(Math.random() * 6) + 1 + ';' +
                            moment().format('YYYY-MM-DD HH:mm:ss');

        fs.appendFile(this.filePath, randomValue+ os.EOL, (err)=>{
            if(err) {
                console.error(err);
                throw err;
            }

            console.log('file is updated %s', moment().format('YYYY-MM-DD HH:mm:ss'));
        });
    }

    _checkIfHeaderExist(){
        let header = 'ip;namen;wert;date';
    }

    _generateResponse(newWorkerData){
        let response = {};

        _.forEach(newWorkerData, (data, index)=>{
            response.worker = data;
            response.worker.latitude = faker.address.latitude();
            response.worker.longitude = faker.address.longitude();

            response.master = {
                ip: "127.0.0.1",
                name: "Master",
                latitude: 52.5074494,
                longitude: 13.4862395
            };
        });

        return [response];
    }
}

module.exports = Processor;