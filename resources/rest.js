var http    = require('http');

module.exports = function (app) {
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
		B35: { // New York Ave Metro
			Predictions: [],
			StationName: "New York Ave"
		}, 
		B04: { // Rhode Island Ave Metro
			Predictions: [],
			StationName: "Rhode Island Ave"
		}, 
		incidents: [],
		weather: {}
	};

	var getBusPredictions = function () {
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
	getBusPredictions();

	// Then every minute
	setInterval(getBusPredictions, 1000 * 60); 

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

	var getWeather = function () {

	};

	getWeather();

	setInterval(getWeather, 1000 * 60 * 10);

	var getTrainPredictions = function () {
		var fetchPredictions = function (station) {
			var options = {
				hostname: 'api.wmata.com',
				port: 80,
				path: '/StationPrediction.svc/json/GetPrediction/' + station + '?' + key,
				method: 'GET'
			};
			var request = http.request(options, function(response) {
				response.on('data', function (data) {
					try {
						stopData[station].Predictions = JSON.parse(data).Trains;
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
	};

	// First time
	getTrainPredictions();

	// Then every minute
	setInterval(getTrainPredictions, 1000 * 60); 

	// Stop JSON REST endpoint
	app.get('/data.json', function (req, res) {
		res.contentType('application/json');
		res.send(stopData);
	});

}