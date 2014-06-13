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

var dashboardApp = angular.module('dashboardApp', ['google-maps']);

dashboardApp.controller('DashboardController', function($scope, $http) {
	$scope.map = {
		center: {
			latitude:   38.9152131,
			longitude: -77.0033354
		},
		zoom: 16,
		bounds: {
			southwest: {
				longitude: -77.008934,
				latitude:   38.908567
			},
			northeast: {
				longitude: -76.997102,
				latitude:   38.920694
			}
		}
	};

	var updateTime = function () {
		$scope.now = new Date();
	};
	updateTime();
	setInterval(updateTime, 1000);

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