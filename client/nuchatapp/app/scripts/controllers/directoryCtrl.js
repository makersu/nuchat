function DirectoryCtrl($scope, $rootScope, $state, $stateParams, RoomService, $timeout) {
	/* Variables */
	// Private

	// Scope public
	$scope.expanded = false;

	/* Methods */
	// Global

	// Private

	// Scope Public

	/* Onload */
	RoomService.setCurrentRoom($stateParams.roomId);
	$scope.room = RoomService.getCurrentRoom();
}