var dashboardApp = angular.module('dashboardApp', []);

dashboardApp.controller('DashboardController', function($scope, $http) {
	var getData = function () {
		$scope.now = new Date();
    	$http.get('data.json').success(function(data) {

	        $scope.busses = [data.south, data.north];
	        $scope.trains = [data.B35, data.B04, data.E02];
	        $scope.trains.forEach(function (station) {
	        	station.Predictions.forEach(function (train) {
	        		if (train.Line != "RD" && 
						train.Line != "GR" && 
						train.Line != "YL" && 
						train.Line != "SV" && 
						train.Line != "SV" && 
						train.Line != "OR") {
	        			train.Line = "";
	        		}
	        	});
	        });
	        $scope.incidents = data.incidents;
	        $scope.temperature = data.weather.temperature;

	    });
    };
    getData();
    setInterval(getData, 5000);
		$http.get('data.json').success(function(data) {
			$scope.incidents = data.incidents;
			$scope.temperature = data.weather.temperature;
			$scope.busses = [data.south, data.north, data.toUSt];
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