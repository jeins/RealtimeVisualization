'use strict';

const express = require('express'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    fs = require('fs');

const Processor = require('./Processor');
const app = express();

// app.server = http.createServer(app);

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
// Processor.runSocket(app);
Processor.runSSE(app);

module.exports = app;