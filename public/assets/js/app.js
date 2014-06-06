var weatherIcons = {
	"clear-day":           "",
	"clear-night":         "",
	"rain":                "",
	"snow":                "",
	"sleet":               "",
	"wind":                "",
	"fog":                 "",
	"cloudy":              "",
	"partly-cloudy-day":   "",
	"partly-cloudy-night": "",
	"hail":                "", // Reserved for future use
	"thunderstorm":        "", // Reserved for future use
	"tornado":             ""  // Reserved for future use
};



// Angular Stuff below here:

var dashboardApp = angular.module('dashboardApp', []);

dashboardApp.controller('DashboardController', function($scope, $http) {
	var getData = function () {
		$scope.now = new Date();
		$http.get('data.json').success(function(data) {
			$scope.incidents = data.incidents;
			$scope.temperature = data.weather.temperature;
			$scope.busses = [data.south, data.north, data.toUSt, data.G8West];
			$scope.trains = [data.B35, data.B04, data.E02];
			$scope.trains.forEach(function (station) {
				if (station) {
					station.Predictions.forEach(function (train) {
						if (train.Line != "RD" && train.Line != "GR" && 
							train.Line != "YL" && train.Line != "SV" && 
							train.Line != "SV" && train.Line != "OR") {
							train.Line = "";
						}
					});
				}
			});
		});
	};
	getData();
	setInterval(getData, 5000);
});