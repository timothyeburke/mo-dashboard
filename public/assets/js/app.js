setTimeout(function () {
	window.location.reload(true)
}, 1000 * 60 * 60 * 12)

var dashboardApp = angular.module('dashboardApp', [])

dashboardApp.controller('DashboardController', function($scope, $http, $timeout) {
	var skycons = new Skycons({color: 'white'})
	skycons.add('weather-icon', 'clear-day')
	skycons.play()

	$scope.map = {
		center: {
			latitude:   38.9155,
			longitude: -77.0050
		},
		MO: {
			latitude:   38.9154000,
			longitude: -77.0033354
		},
		zoom: 16
	}

	var map = L.map('map').setView([$scope.map.center.latitude, $scope.map.center.longitude], $scope.map.zoom)
	var token = 'pk.eyJ1IjoibGV0bWVmdWNraW5ndXNlbXllbWFpbCIsImEiOiJjaWt5bnhyMzIwM2U0dWFrczI3NDFxZmZsIn0.pLnMkfQznZ70gq7mGGoZRA'

	L.tileLayer('https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token={accessToken}', {
	    attribution: '',
	    maxZoom: 18,
	    id: 'MO Dashboard',
	    accessToken: token
	}).addTo(map)

	var updateContentHeight = function () {
		var incidentsHeight = document.getElementById("incidents").clientHeight
		var headerHeight = document.getElementById("main-header").clientHeight
		var viewportHeight = document.documentElement.clientHeight
		var content = document.getElementById("content")
		content.setAttribute("style","height: " + (viewportHeight - incidentsHeight - headerHeight) + "px;")
		map.invalidateSize(true)
	}

	var updateTime = function () {
		$scope.now = new Date()
	}
	updateTime()
	setInterval(updateTime, 1000)

	var same = function (array1, array2, comparator) {
		if (!array1 || !array2) return false
		if (array1.length != array2.length) return false
		var result = true
		for (var i = 0; i < array1.length; i++) {
			result = result && (array1[i][comparator] == array2[i][comparator])
		}
		return result
	}

	var markers = []

	var IconBase = L.Icon.extend({})
	var car2goIcon = new IconBase({iconUrl: 'assets/img/car2go.png', iconAnchor: [10, 35]})
	var bikeshareIcon = new IconBase({iconUrl: 'assets/img/bikeshare.png', iconAnchor: [10, 35]})
	var moIcon = new IconBase({iconUrl: 'assets/img/MO.icon.png', iconAnchor: [0, 0]})
	var busIcon = new IconBase({iconUrl: 'assets/img/metro/bus-small.png', iconAnchor: [10, 35]})

	L.marker([$scope.map.MO.latitude, $scope.map.MO.longitude], {icon: moIcon}).addTo(map)

	function addMarker(icon, coordinates) {
		markers.push(L.marker(coordinates, {icon: icon}).addTo(map))
	}

	function removeMarkers() {
		markers.forEach(function(marker) {
			map.removeLayer(marker)
		})
	}

	var getData = function () {
		$http.get('data.json').success(function(data) {
			removeMarkers()

			data.car2go.forEach(function(car) {
				addMarker(car2goIcon, [car.coordinates[1], car.coordinates[0]])
			})

			data.bikeshare.forEach(function(station) {
				// TODO: Figure out text markers to show bikes available
				addMarker(bikeshareIcon, [station.latitude, station.longitude])
			})

			data.liveBusses.forEach(function(bus) {
				addMarker(busIcon, [bus.latitude, bus.longitude])
			})

			$scope.incidents = data.incidents
			$scope.busses    = data.busses
			$scope.trains    = data.trains
			$scope.weather   = data.weather
			skycons.set("weather-icon", data.weather.icon)
			setTimeout(updateContentHeight, 25)
		})
	}
	getData()
	setInterval(getData, 5000)

	$http.get('red.json').success(function (data) {
		L.geoJson(data, {
		    color: "#f00",
		    weight: 5,
		    opacity: 0.65
		}).addTo(map)
	})
})
