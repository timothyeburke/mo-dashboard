var http     = require('http');
var https    = require('https');
var Forecast = require('forecast.io');
var xml      = require('xml2js');
var _        = require('lodash');

var getWmataApiKey = function () {
	var keys = [
		// 'd46qgb277rn9hq8q8emvqyfr', // Testing
		// 'nhc5bsanvc3b565fytmb5bz2', // MetroOverlookDashTrains
		// '9kcrbzzhv34vpgb4pecb6g5n'  // MetroOverlookDashBusses
		'fkcfzjmc3fgnukkpcxp3qt3v', // TransitDashKey0
		'vckbehh2wrshadvamnwjbk9v', // TransitDashKey1
		'ws432ar39vd82q5ps2rb7hae', // TransitDashKey2
		'm9b6huznrdhrsdmqx9ac6agd', // TransitDashKey3
		'bd73dmyt4pmnbkes8hz8tfwj', // TransitDashKey4
		'634qz8w9axe3frqy6vvts9gh', // TransitDashKey5
		'qvcrsqvz4ua58y7phr626gqz', // TransitDashKey6
		'f3pg6nwnscpccmkqjnz7dja8', // TransitDashKey7
		'g3jkkuzn2ypggjjpkawpwvp4', // TransitDashKey8
		'm9wd7garmn6bgyvxmt92q3ar'  // TransitDashKey9
	];

	var key = keys[Math.floor(Math.random() * keys.length)];
	return '&api_key=' + key + '&subscription-key=' + key;
}

module.exports = function (app) {
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
		liveBusses: [],
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

	var getBusPositions = function () {
		var fetchPositions = function () {
			var options = {
				hostname: 'api.wmata.com',
				port: 443,
				path: '/Bus.svc/json/jBusPositions?RouteID&Lat=38.9155&Lon=-77.0050&Radius=1600' + getWmataApiKey(),
				method: 'GET'
			};

			var data = '';
			var request = https.get(options, function (response) {
				response.on('data', function (d) {
					data += d;
				});

				response.on('end', function () {
					try {
						var busses = JSON.parse(data);

						db.liveBusses.length = 0;
						busses.BusPositions.forEach(function (bus) {
							bus.latitude = bus.Lat;
							bus.longitude = bus.Lon;
							db.liveBusses.push(bus);
						});

						db.liveBusses = _.filter(db.liveBusses, function (bus) {
							return isInBbox(bus.Lon, bus.Lat, bbox.westLon, bbox.eastLon, bbox.southLat, bbox.northLat);
						});
					} catch (err) {
						console.log("Error parsing json.");
					}
				});

				response.on('error', function () {
					console.log(new Date().toString() + " : Error getting live bus data.");
				});
			});
		};

		fetchPositions();
	};

	getBusPositions();
	setInterval(getBusPositions, 1000 * 10);

	var getBusPredictions = function () {
		var errorObject = {
			Predictions: [],
			StopName: "Error fetching bus data."
		};
		var fetchPredictions = function (stop, direction) {
			var options = {
				hostname: 'api.wmata.com',
				port: 443,
				path: '/NextBusService.svc/json/jPredictions?StopID=' + stop + getWmataApiKey(),
				method: 'GET'
			};
			var data = '';
			var request = https.get(options, function(response) {
				response.on('data', function (d) {
					data += d;
				});

				response.on('end', function () {
					try {
						db[direction] = JSON.parse(data);
					} catch (err) {
						db[direction] = errorObject;
					}
					if (db[direction] == undefined) {
						db[direction] = errorObject;
					}
				});

				response.on('error', function () {
					console.log(new Date().toString() + " : Error getting bus data.");
				});
			});
			request.end();
		};
		fetchPredictions(1001624, "south");
		// fetchPredictions(1001620, "north"); // P6 North - not really needed
		fetchPredictions(1001425, "toUSt");
		fetchPredictions(1001715, "G8West");
		fetchPredictions(1003467, "G8East");
	};
	getBusPredictions();
	setInterval(getBusPredictions, 1000 * 25);

	var getIncidents = function () {
		var options = {
			hostname: 'api.wmata.com',
			port: 443,
			path: '/Incidents.svc/json/Incidents?' + getWmataApiKey(),
			method: 'GET'
		};
		var temp = '';
		var request = https.get(options, function(response) {
			response.on('data', function (d) {
				temp += d;
			});

			response.on('end', function () {
				try {
					db.incidents = JSON.parse(temp).Incidents;
					db.incidents.forEach(function (incident) {
						incident.affected = _.compact(incident.LinesAffected.split(';'));
						incident.Description = _.trim(incident.Description.replace(/(Blue|Orange|Red|Silver|Green|Yellow) Line\:/ig, ''));
						console.log(incident.Description);
						if (incident.Description.indexOf(".") != -1) {
							incident.Description = incident.Description.split(".")[0] + ".";
						}
					});
				} catch (err) {
					// db.incidents = [];
				}
				if (db.incidents == undefined) {
					db.incidents = [];
				}
			});

			response.on('error', function () {
				// db.incidents = [];
				console.log(new Date().toString() + " : Error getting incident data.");
			});
		});
		request.end();
	};
	getIncidents();
	setInterval(getIncidents, 1000 * 60);

	var getWeather = function () {
		var lon = -77.0033354;
		var lat =  38.9152131;
		var forecast_key = '2cb1727e2157365c87d67c621ec1bf43';

		var forecast = new Forecast({
			APIKey: forecast_key
		});

		forecast.get(lat, lon, function (err, res, data) {
			if (err) {
				console.log(new Date().toString() + " : " + err);
				db.weather = {};
			}
			data.currently.low = _.min(data.hourly.data, function (hour) {
				return hour.temperature;
			});
			data.currently.high = _.max(data.hourly.data, function (hour) {
				return hour.temperature;
			});
			db.weather = data.currently;
		});
	};
	getWeather();
	setInterval(getWeather, 1000 * 60 * 10);

	var getTrainPredictions = function () {
		var fetchPredictions = function (station) {
			var options = {
				hostname: 'api.wmata.com',
				port: 443,
				path: '/StationPrediction.svc/json/GetPrediction/' + station + '?' + getWmataApiKey(),
				method: 'GET'
			};
			var temp = '';
			var request = https.get(options, function(response) {
				response.on('data', function (d) {
					temp += d;
				});

				response.on('end', function () {
					try {
						db[station].Predictions = JSON.parse(temp).Trains;
						db[station].Predictions.forEach(function (train) {
							if (train.Line != "RD" && train.Line != "GR" &&
								train.Line != "YL" && train.Line != "SV" &&
								train.Line != "SV" && train.Line != "OR") {
								train.Line = "";
							}
						});
					} catch (err) {
						// db[station].Predictions = [];
					}
				});

				response.on('error', function () {
					console.log(new Date().toString() + " : Error getting train data.");
					// db[station].Predictions = [];
				});
			});
			request.end();
		};
		fetchPredictions("B35");
		fetchPredictions("B04");
		fetchPredictions("E02");
	};
	getTrainPredictions();
	setInterval(getTrainPredictions, 1000 * 60);

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
			port: 443,
			path: '/data/stations/bikeStations.xml',
			method: 'GET'
		};
		var temp = '';
		var request = https.get(options, function (response) {
			response.on('data', function (d) {
				temp += d;
			});

			response.on('end', function () {
				processBikeshareXML(temp);
			});

			response.on('error', function (err) {
				console.log(new Date().toString() + " : Error getting Bikeshare data.");
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
			response.on('data', function (d) {
				temp += d;
			});

			response.on('end', function () {
				try {
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
				console.log(new Date().toString() + " : Error getting car2go data.");
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
			liveBusses: db.liveBusses,
			trains:    [db.B35, db.B04, db.E02],
			weather:   db.weather
		};

		res.contentType('application/json');
		res.send(data);
	});

	app.get('/work.json', function (req, res) {
		var data = {
			busses: [db.G8East]
		}

		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		res.contentType('application/json');
		res.send(JSON.stringify(data, null, 4));
	});
}