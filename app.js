var express = require('express');
var app     = express();

if (process.env.PORT) {
	var rest = require('./resources/rest')(app);	
}

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

var port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log("Listening on port " + port);
});
