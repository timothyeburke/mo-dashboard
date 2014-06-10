setTimeout(function () {
	window.location.reload(true);
}, 1000 * 60 * 60);

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
	setInterval(function () {
		$scope.now = new Date();
	}, 1000);
	var getData = function () {
		$http.get('data.json').success(function(data) {
			$scope.bikeshare = data.bikeshare;
			$scope.busses    = data.busses;
			$scope.car2go    = data.car2go;
			$scope.incidents = data.incidents;
			$scope.trains    = data.trains;
			$scope.weather   = data.weather;
		});
	};
	getData();
	setInterval(getData, 5000);
});