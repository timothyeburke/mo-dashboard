setTimeout(function () {
	window.location.reload(true);
}, 1000 * 60 * 60 * 12);

// Angular Stuff below here:

var dashboardApp = angular.module('dashboardApp', ['uiGmapgoogle-maps']);

dashboardApp.controller('DashboardController', function($scope, $http) {
	var skycons = new Skycons({"color": "white"});
	skycons.add("weather-icon", "clear-day");
	skycons.play();

	$scope.map = {
		control: {},
		center: {
			latitude:   38.9155,
			longitude: -77.0050
		},
		MO: {
			latitude:   38.9152131,
			longitude: -77.0033354
		},
		zoom: 16,
		options: {
			disableDefaultUI: true
		}
	};

	var updateContentHeight = function () {
		var incidentsHeight = document.getElementById("incidents").clientHeight;
		var headerHeight = document.getElementById("main-header").clientHeight;
		var viewportHeight = document.documentElement.clientHeight;
		var content = document.getElementById("content");
		content.setAttribute("style","height: " + (viewportHeight - incidentsHeight - headerHeight) + "px;");
		$scope.map.control.refresh($scope.map.center);
	};

	var updateTime = function () {
		$scope.now = new Date();
	};
	updateTime();
	setInterval(updateTime, 1000);

	var same = function (array1, array2, comparator) {
		if (!array1 || !array2) return false;
		if (array1.length != array2.length) return false;
		var result = true;
		for (var i = 0; i < array1.length; i++) {
			result = result && (array1[i][comparator] == array2[i][comparator]);
		}
		return result;
	}

	var getData = function () {
		$http.get('data.json').success(function(data) {
			if (!same($scope.bikeshare, data.bikeshare, "nbBikes")) {
				$scope.bikeshare = data.bikeshare;
			}
			$scope.busses    = data.busses;
			if (!same($scope.car2go, data.car2go, "vin")) {
				$scope.car2go = data.car2go;
			}
			$scope.incidents = data.incidents;
			$scope.trains    = data.trains;
			$scope.weather   = data.weather;
			$scope.liveBusses = data.liveBusses;
			skycons.set("weather-icon", data.weather.icon);
			setTimeout(updateContentHeight, 25);
		});
	};
	getData();
	setInterval(getData, 5000);

	$http.get('red.json').success(function (data) {
		var red = {};
		red.points = [];
		data.geometry.coordinates.forEach(function (pair) {
			lat = pair[1];
			lon = pair[0];
			red.points.push({
				latitude: lat,
				longitude: lon
			});
		});
		$scope.red = red;
	});
});