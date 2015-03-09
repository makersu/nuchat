function DirectoryCtrl($scope, $state, $stateParams, RoomService, $timeout, $ionicNavBarDelegate) {
	/* Variables */
	// Private

	// Scope public

	/* Methods */
	// Private
	// Scope Public
	$scope.hideNavBar = function() {
		// To hide the nav bar
		$timeout(function() {
			$ionicNavBarDelegate.showBar(false);
		});
	};

	/* Onload */
	RoomService.set($stateParams.roomId);
	$scope.room = RoomService.get();
}