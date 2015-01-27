angular.module('Nuchatapp.controllers')
	.controller('AccountCtrl', function($scope, User, $location) {
		
		console.log('AccountCtrl')
		
		$scope.currentUser = User.getCurrent();

      /**
       * @name logout()
       * logout user and redirect to the login page
       */
    $scope.logout = function () {
        User.logout(function () {
        	$location.path('/login');
        });
    }

	});