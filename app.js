var express = require('express');
var http    = require('http');

var app     = express();

var key = '&api_key=d46qgb277rn9hq8q8emvqyfr';

app.use(express.logger());
app.use(express.static(__dirname + '/public'));

app.get('/stop.json', function (req, res) {
	//http://api.wmata.com

	var stop = req.query.stop || 1001624;

	var options = {
		hostname: 'api.wmata.com',
		port: 80,
		path: '/NextBusService.svc/json/jPredictions?StopID=' + stop + key,
		method: 'GET'
	};
	var request = http.request(options, function(response) {
		response.on('data', function (data) {
			res.contentType('application/json');
			res.send(data);
		});
	});
	request.end();
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log("Listening on port " + port);
});
