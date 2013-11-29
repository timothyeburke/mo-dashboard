var express = require('express');
var http    = require('http');

var app     = express();

var key = '&api_key=d46qgb277rn9hq8q8emvqyfr';

var stopData = {
	south: { 
		Predictions: [], 
		StopName: ""
	},
	north: { 
		Predictions: [], 
		StopName: ""
	}
};

var getData = function (stop, direction) {
	var options = {
		hostname: 'api.wmata.com',
		port: 80,
		path: '/NextBusService.svc/json/jPredictions?StopID=' + stop + key,
		method: 'GET'
	};
	var request = http.request(options, function(response) {
		response.on('data', function (data) {
			try {
				stopData[direction] = JSON.parse(data);
			} catch (err) {
				console.log(err);
				stopData[direction] = {
					Predictions: [],
					StopName: "Error fetching data."
				}
			}
		});
		response.on('error', function () {
			stopData[direction] = {
				Predictions: [],
				StopName: "Error fetching data."
			}
		});
	});
	request.end();
};

// First time
getData(1001624, "south"); 
getData(1001620, "north");

// Then every minute
setInterval(function () {
	getData(1001624, "south");
	getData(1001620, "north");
}, 1000 * 60); 

// simple logger
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

// Static files
app.use(express.static(__dirname + '/public'));

// Stop JSON REST endpoint
app.get('/stop.json', function (req, res) {
	res.contentType('application/json');
	res.send(stopData);
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log("Listening on port " + port);
});
