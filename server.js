const path = require('path');
const express = require('express');
const app = express();

const fs = require('fs');
const http = require('http');
const https = require('https');
const privateKey  = fs.readFileSync('sslcert/key-20161212-184641.pem', 'utf8');
const certificate = fs.readFileSync('sslcert/cert-20161212-184641.crt', 'utf8');

const credentials = {key: privateKey, cert: certificate};

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

// very dummy logger
app.use(function(req, res, next) {
	console.log(`${Date()}: ${req.method} ${req.originalUrl}`);
	next();
});

app.use('/', require('./routes/widget'));
app.get('/', function (req, res) {
	res.redirect('/widgets');
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', function(err, req, res, next) {
	console.dir(err);
	next(err, req ,res);
});

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(8080);
httpsServer.listen(8443);