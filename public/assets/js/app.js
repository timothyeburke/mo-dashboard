setTimeout(function () {
	window.location.reload(true);
}, 1000 * 60 * 60);

// Angular Stuff below here:

var dashboardApp = angular.module('dashboardApp', ['google-maps']);

dashboardApp.controller('DashboardController', function($scope, $http) {
	var skycons = new Skycons({"color": "white"});
	skycons.add("weather-icon", "clear-day");
	skycons.play();

	$scope.map = {
		center: {
			latitude:   38.9155,
			longitude: -77.005
		},
		MO: {
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
		var same = function (array1, array2, comparator) {
			if (!array1 || !array2) return false;
			if (array1.length != array2.length) return false;
			var result = true;
			for (var i = 0; i < array1.length; i++) {
				result = result && (array1[i][comparator] == array2[i][comparator]);
			}
			return result;
		}

		$http.get('data.json').success(function(data) {
			if (!same($scope.bikeshare, data.bikeshare, "nbBikes")) {
				$scope.bikeshare = data.bikeshare;
				console.log("bikeshare different");
			}
			$scope.busses    = data.busses;
			if (!same($scope.car2go, data.car2go, "vin")) {
				$scope.car2go = data.car2go;
				console.log("car2go different");
			}
			$scope.incidents = data.incidents;
			$scope.trains    = data.trains;
			$scope.weather   = data.weather;
			skycons.set("weather-icon", data.weather.icon);
		});
	};
	getData();
	setInterval(getData, 5000);
});