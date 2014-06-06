var http     = require('http');
var Forecast = require('forecast.io');

module.exports = function (app) {
	var default_key = '&api_key=d46qgb277rn9hq8q8emvqyfr';
	var train_key = '&api_key=nhc5bsanvc3b565fytmb5bz2';
	var bus_key = '&api_key=9kcrbzzhv34vpgb4pecb6g5n';

	var stopData = {
		south: { 
			Predictions: [], 
			StopName: ""
		},
		north: { 
			Predictions: [], 
			StopName: ""
		},
		B35: { // New York Ave Metro
			Predictions: [],
			StationName: "New York Ave"
		}, 
		B04: { // Rhode Island Ave Metro
			Predictions: [],
			StationName: "Rhode Island Ave"
		}, 
		E02: { // Shaw Metro
			Predictions: [],
			StationName: "Shaw / Howard U"
		},
		incidents: [],
		weather: {}
	};

	var getBusPredictions = function () {
		var errorObject = {
			Predictions: [],
			StopName: "Error fetching data."
		};
		var fetchPredictions = function (stop, direction) {
			var options = {
				hostname: 'api.wmata.com',
				port: 80,
				path: '/NextBusService.svc/json/jPredictions?StopID=' + stop + bus_key,
				method: 'GET'
			};
			var temp = '';
			var request = http.get(options, function(response) {
				response.on('data', function (data) {
					try {
						temp += data;
						stopData[direction] = JSON.parse(temp);
					} catch (err) {
						console.log(err);
						stopData[direction] = errorObject;
					}
					if (stopData[direction] == undefined) {
					stopData.incidents = errorObject;
				}
				});
				response.on('error', function () {
					stopData[direction] = errorObject;
				});
			});
			request.end();
		};
		fetchPredictions(1001624, "south"); 
		fetchPredictions(1001620, "north");
	};

	// First time
	getBusPredictions();

	// Then every minute
	setInterval(getBusPredictions, 1000 * 15); 

	var getIncidents = function () {
		var options = {
			hostname: 'api.wmata.com',
			port: 80,
			path: '/Incidents.svc/json/Incidents?' + default_key,
			method: 'GET'
		};
		var temp = '';
		var request = http.get(options, function(response) {
			response.on('data', function (data) {
				try {
					temp += data;
					stopData.incidents = JSON.parse(temp).Incidents;
				} catch (err) {
					console.log(err);
					stopData.incidents = [];
				}
				if (stopData.incidents == undefined) {
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

	var getWeather = function () {
		var lon = -77.0033354;
		var lat =  38.9152131;
		var forecast_key = '2cb1727e2157365c87d67c621ec1bf43';

		var forecast = new Forecast({
			APIKey: forecast_key
		});

		forecast.get(lat, lon, function (err, res, data) {
			if (err) {
				console.log(err);
				stopData.weather = {};
			}
			stopData.weather = data.currently;
		});
	};

	getWeather();

	setInterval(getWeather, 1000 * 60 * 10);

	var getTrainPredictions = function () {
		var fetchPredictions = function (station) {
			var options = {
				hostname: 'api.wmata.com',
				port: 80,
				path: '/StationPrediction.svc/json/GetPrediction/' + station + '?' + train_key,
				method: 'GET'
			};
			var temp = '';
			var request = http.get(options, function(response) {
				response.on('data', function (data) {
					try {
						temp += data;
						stopData[station].Predictions = JSON.parse(temp).Trains;
					} catch (err) {
						console.log(err);
						stopData[station].Predictions = [];
					}
				});
				response.on('error', function () {
					stopData[station].Predictions = [];
				});
			});
			request.end();
		};
		fetchPredictions("B35"); 
		fetchPredictions("B04");
		fetchPredictions("E02");
	};

	// First time
	getTrainPredictions();

	// Then every minute
	setInterval(getTrainPredictions, 1000 * 30);

	// Stop JSON REST endpoint
	app.get('/data.json', function (req, res) {
		res.contentType('application/json');
		res.send(stopData);
	});

}