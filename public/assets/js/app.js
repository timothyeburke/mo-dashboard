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
			$scope.weather = data.weather;
			$scope.busses = data.busses;
			$scope.trains = data.trains;
		});
	};
	getData();
	// setInterval(getData, 5000);
});