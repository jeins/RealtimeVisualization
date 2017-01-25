'use strict';

const http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    fs = require('fs');

const Processor = require('./Processor');
const app = express();

app.server = http.createServer(app);

app.set('port', 8888);
app.set('host', 'localhost');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(express.static(__dirname + '/../public/dist'));

app.all('*', function(req, res) {
    res.writeHead(200, { 'Content-type': 'text/html'});
    res.end(fs.readFileSync(__dirname + '/../public/dist/index.html'));
});

Processor.runCronJob();
Processor.runSocket(app.server);

app.server.listen(app.get('port'), app.get('host'), ()=>{
    console.log('Service is running at http://%s:%d', app.get('host'), app.get('port'));
});

module.exports = app;