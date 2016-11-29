import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import fs from 'fs';

import Processor from './Processor';

var app = express();
app.server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(express.static(__dirname + '/../public'));

app.all('*', function(req, res) {
    res.writeHead(200, { 'Content-type': 'text/html'});
    res.end(fs.readFileSync(__dirname + '/../public/index.html'));
});

var processor = new Processor();
processor.runCronJob();
processor.runSocket(app.server);

app.server.listen('8888', 'localhost', ()=>{
    console.log("Server run on localhost:8888");
});

export default app;