var dashboardApp = angular.module('dashboardApp', []);

dashboardApp.controller('DashboardController', function($scope, $http) {
	var getData = function () {
		$scope.now = new Date();
    	$http.get('data.json').success(function(data) {

	        $scope.busses = [data.south, data.north];
	        $scope.trains = [data.B35, data.B04];
	        $scope.incidents = data.incidents;
	        $scope.temperature = 75;

	    });
    };
    getData();
    setInterval(getData, 5000);
});