angular.module('Nuchatapp.controllers')
	.controller('DashCtrl', function($scope, lbSocket){
		console.log('DashCtrl');

		$scope.availableRooms = []

		lbSocket.emit('rooms:get', {});

		lbSocket.on('rooms:new', function(room) {
			console.log(room)
	    $scope.availableRooms.push(room);
	  });

  });