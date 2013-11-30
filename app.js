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
	},
	incidents: []
};

var getPredictions = function () {
	var fetchPredictions = function (stop, direction) {
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
	fetchPredictions(1001624, "south"); 
	fetchPredictions(1001620, "north");
};

// First time
getPredictions();

// Then every minute
setInterval(getPredictions, 1000 * 60); 

var getIncidents = function () {
	var options = {
		hostname: 'api.wmata.com',
		port: 80,
		path: '/Incidents.svc/json/Incidents?' + key,
		method: 'GET'
	};
	var request = http.request(options, function(response) {
		response.on('data', function (data) {
			try {
				stopData.incidents = JSON.parse(data).Incidents;
			} catch (err) {
				console.log(data.toString());
				console.log(err);
				stopData.incidents = [];
			}
		});
		response.on('error', function () {
			stopData.incidents = []
		});
	});
	request.end();
};

getIncidents();

setInterval(getIncidents, 1000 * 60 * 5);

// simple logger
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

// Static files
app.use(express.static(__dirname + '/public'));

// ADD GLOBAL ERROR HANDLER HERE
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'Something broke!');
});

// Stop JSON REST endpoint
app.get('/data.json', function (req, res) {
	res.contentType('application/json');
	res.send(stopData);
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log("Listening on port " + port);
});
