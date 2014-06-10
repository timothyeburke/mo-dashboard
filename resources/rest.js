var http     = require('http');
var https    = require('https');
var Forecast = require('forecast.io');
var xml      = require('xml2js');
var _        = require('underscore');

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
		toUSt: { 
			Predictions: [], 
			StopName: ""
		},
		G8West: {
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
		bikeshare: [],
		car2go: [],
		incidents: [],
		weather: {}
	};

	var getBusPredictions = function () {
		var errorObject = {
			Predictions: [],
			StopName: "Error fetching bus data."
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
		// fetchPredictions(1001620, "north"); // P6 North - not really needed
		fetchPredictions(1001425, "toUSt");
		fetchPredictions(1001715, "G8West")
	};

	// First time
	getBusPredictions();

	// Then every minute
	setInterval(getBusPredictions, 1000 * 25); 

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
					stopData.incidents.forEach(function (incident) {
						incident.affected = _.compact(incident.LinesAffected.split(';'));
						if (incident.Description.indexOf(":") != -1) {
							incident.Description = incident.Description.split(":")[1];
						}
						if (incident.Description.indexOf(".") != -1) {
							incident.Description = incident.Description.split(".")[0] + ".";
						}
					});
				} catch (err) {
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
						stopData[station].Predictions.forEach(function (train) {
							if (train.Line != "RD" && train.Line != "GR" && 
								train.Line != "YL" && train.Line != "SV" && 
								train.Line != "SV" && train.Line != "OR") {
								train.Line = "";
							}
						});
					} catch (err) {
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

	var getBikeshareData = function () {
		var processBikeshareXML = function (data) {
			stopData.bikeshare.length = 0;
			xml.parseString(data, function(err, result) {
				var stations = result.stations.station;
				stations.forEach(function (station) {
					var id = station.id[0];
					if (id == '94' || id == '250' || id == '42') {
						stopData.bikeshare.push({
							id: station.id[0],
							name: station.name[0],
							terminalName: station.terminalName[0],
							lastCommWithServer: station.lastCommWithServer[0],
							lat: station.lat[0],
							lon: station.long[0],
							nbBikes: station.nbBikes[0],
							nbEmptyDocks: station.nbEmptyDocks[0]
						});
					}
				});
			});
		}
		var options = {
			hostname: 'www.capitalbikeshare.com',
			port: 80,
			path: '/data/stations/bikeStations.xml',
			method: 'GET'
		};
		var temp = '';
		var request = http.get(options, function (response) {
			response.on('data', function (data) {
				temp += data;
				if (temp.indexOf("</stations>") != -1) {
					processBikeshareXML(temp);
				}
			});
		});
	};

	getBikeshareData();

	setInterval(getBikeshareData, 1000 * 60);

	var getCar2GoData = function () {
		var isInBbox = function (lon, lat, bbox) {
			// This only works in the northern and western hemispheres.  Meh?
			return lon <= bbox.minLon && lon >= bbox.maxLon && lat >= bbox.minLat && lat <= bbox.maxLat;
		}
		
		var bbox = {
			minLon: -76.997102,
			maxLon: -77.008934,
			minLat: 38.908567,
			maxLat: 38.920694
		};

		var options = {
			hostname: 'www.car2go.com',
			port: 443,
			path: '/api/v2.0/vehicles?loc=Washington%20DC&format=json',
			method: 'GET'
		};
		var temp = '';
		var request = https.get(options, function(response) {
			response.on('data', function (data) {
				try {
					temp += data;
					var car2go = JSON.parse(temp);
					stopData.car2go.length = 0;
					car2go.placemarks.forEach(function (car) {
						car.coordinates = eval(car.coordinates);
						if (isInBbox(car.coordinates[0], car.coordinates[1], bbox)) {
							stopData.car2go.push(car);
						}
					});
				} catch (err) {
				}
			});
			response.on('error', function () {
				console.log("Error getting car2go data.");
				stopData.car2go.length = 0;
			});
		});
		request.end();
	};

	getCar2GoData();

	setInterval(getCar2GoData, 1000 * 60);

	// Data JSON REST endpoint
	app.get('/data.json', function (req, res) {
		var data = {
			bikeshare: stopData.bikeshare,
			busses:    [stopData.south, stopData.toUSt, stopData.G8West],
			car2go:    stopData.car2go,
			incidents: stopData.incidents,
			trains:    [stopData.B35, stopData.B04, stopData.E02],
			weather:   stopData.weather
		};

		res.contentType('application/json');
		res.send(data); 
	});
}