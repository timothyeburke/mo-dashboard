var http     = require('http');
var https    = require('https');
var Forecast = require('forecast.io');
var xml      = require('xml2js');
var _        = require('underscore');

var getWmataApiKey = function () {
	var keys = [
		'd46qgb277rn9hq8q8emvqyfr',
		'nhc5bsanvc3b565fytmb5bz2',
		'9kcrbzzhv34vpgb4pecb6g5n'
	];
	return '&api_key=' + keys[Math.floor(Math.random() * keys.length)];
}

module.exports = function (app) {
	var default_wmata_key = '&api_key=d46qgb277rn9hq8q8emvqyfr';
	var train_wmata_key = '&api_key=nhc5bsanvc3b565fytmb5bz2';
	var bus_wmata_key = '&api_key=9kcrbzzhv34vpgb4pecb6g5n';

	var db = {
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

	var bbox = {
		westLon:  -77.012500,
		eastLon:  -76.997900,
		southLat:  38.908567,
		northLat:  38.920694
	};

	var isInBbox = function(lon, lat, westLon, eastLon, southLat, northLat) { 
		return westLon <= lon && lon <= eastLon && southLat <= lat && lat <= northLat; 
	}

	var getBusPredictions = function () {
		var errorObject = {
			Predictions: [],
			StopName: "Error fetching bus data."
		};
		var fetchPredictions = function (stop, direction) {
			var options = {
				hostname: 'api.wmata.com',
				port: 80,
				path: '/NextBusService.svc/json/jPredictions?StopID=' + stop + bus_wmata_key,
				method: 'GET'
			};
			var temp = '';
			var request = http.get(options, function(response) {
				response.on('data', function (data) {
					try {
						temp += data;
						db[direction] = JSON.parse(temp);
					} catch (err) {
						// db[direction] = errorObject;
					}
					if (db[direction] == undefined) {
						db[direction] = errorObject;
					}
				});
				response.on('error', function () {
					// db[direction] = errorObject;
				});
			});
			request.end();
		};
		fetchPredictions(1001624, "south"); 
		// fetchPredictions(1001620, "north"); // P6 North - not really needed
		fetchPredictions(1001425, "toUSt");
		fetchPredictions(1001715, "G8West")
	};
	getBusPredictions();
	setInterval(getBusPredictions, 1000 * 25); 

	var getIncidents = function () {
		var options = {
			hostname: 'api.wmata.com',
			port: 80,
			path: '/Incidents.svc/json/Incidents?' + default_wmata_key,
			method: 'GET'
		};
		var temp = '';
		var request = http.get(options, function(response) {
			response.on('data', function (data) {
				try {
					temp += data;
					db.incidents = JSON.parse(temp).Incidents;
					db.incidents.forEach(function (incident) {
						incident.affected = _.compact(incident.LinesAffected.split(';'));
						if (incident.Description.indexOf(":") != -1) {
							incident.Description = incident.Description.split(":")[1];
						}
						if (incident.Description.indexOf(".") != -1) {
							incident.Description = incident.Description.split(".")[0] + ".";
						}
					});
				} catch (err) {
					db.incidents = [];
				}
				if (db.incidents == undefined) {
					db.incidents = [];
				}
			});
			response.on('error', function () {
				db.incidents = []
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
				db.weather = {};
			}
			db.weather = data.currently;
		});
	};
	getWeather();
	setInterval(getWeather, 1000 * 60 * 10);

	var getTrainPredictions = function () {
		var fetchPredictions = function (station) {
			var options = {
				hostname: 'api.wmata.com',
				port: 80,
				path: '/StationPrediction.svc/json/GetPrediction/' + station + '?' + train_wmata_key,
				method: 'GET'
			};
			var temp = '';
			var request = http.get(options, function(response) {
				response.on('data', function (data) {
					try {
						temp += data;
						db[station].Predictions = JSON.parse(temp).Trains;
						db[station].Predictions.forEach(function (train) {
							if (train.Line != "RD" && train.Line != "GR" && 
								train.Line != "YL" && train.Line != "SV" && 
								train.Line != "SV" && train.Line != "OR") {
								train.Line = "";
							}
						});
					} catch (err) {
						db[station].Predictions = [];
					}
				});
				response.on('error', function () {
					db[station].Predictions = [];
				});
			});
			request.end();
		};
		fetchPredictions("B35"); 
		fetchPredictions("B04");
		fetchPredictions("E02");
	};
	getTrainPredictions();
	setInterval(getTrainPredictions, 1000 * 30);

	var getBikeshareData = function () {
		var processBikeshareXML = function (data) {
			db.bikeshare.length = 0;
			xml.parseString(data, function(err, result) {
				var stations = result.stations.station;
				stations.forEach(function (station) {
					var id = station.id[0];
					var lon = station.long[0];
					var lat = station.lat[0];
					if (isInBbox(lon, lat, bbox.westLon, bbox.eastLon, bbox.southLat, bbox.northLat)) {
						db.bikeshare.push({
							id: station.id[0],
							name: station.name[0],
							terminalName: station.terminalName[0],
							lastCommWithServer: station.lastCommWithServer[0],
							latitude: station.lat[0],
							longitude: station.long[0],
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
					db.car2go.length = 0;
					car2go.placemarks.forEach(function (car) {
						car.coordinates = eval(car.coordinates);
						var lon = car.coordinates[0];
						var lat = car.coordinates[1];
						if (isInBbox(lon, lat, bbox.westLon, bbox.eastLon, bbox.southLat, bbox.northLat)) {
							car.longitude = lon;
							car.latitude  = lat;
							db.car2go.push(car);
						}
					});
				} catch (err) {
				}
			});
			response.on('error', function () {
				console.log("Error getting car2go data.");
				db.car2go.length = 0;
			});
		});
		request.end();
	};
	getCar2GoData();
	setInterval(getCar2GoData, 1000 * 60);

	// Data JSON REST endpoint
	app.get('/data.json', function (req, res) {
		var data = {
			bikeshare: db.bikeshare,
			busses:    [db.south, db.toUSt, db.G8West],
			car2go:    db.car2go,
			incidents: db.incidents,
			trains:    [db.B35, db.B04, db.E02],
			weather:   db.weather
		};

		res.contentType('application/json');
		res.send(data); 
	});
}