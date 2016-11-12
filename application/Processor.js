import fs from 'fs';
import cron from 'cron';
import moment from 'moment';
import faker from 'faker';
import os from 'os';

class Processor{
    constructor(){
        this.filePath = 'public/worker.txt';
        this.cronJob = cron.job("*/15 * * * * *", ()=>{
            this.writeRandomDataToFile();
        });
    }

    runCronJob(){
        console.log("Start CronJob");
        this.cronJob.start();
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
}

module.exports = Processor;