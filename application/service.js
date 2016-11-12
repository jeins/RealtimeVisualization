import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import Processor from './Processor';

var app = express();
app.server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

app.use('/', (req, res)=>{
    res.json({"version": "1"});
});

var processor = new Processor();
processor.runCronJob();

app.server.listen('8888', 'localhost', ()=>{
    console.log("Listening on");
});

export default app;