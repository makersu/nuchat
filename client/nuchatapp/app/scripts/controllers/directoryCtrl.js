function DirectoryCtrl($scope, $rootScope, $state, $stateParams, RoomService, $timeout, $NUChatTags) {
	/* Variables */
	// Private

	// Scope public
	$scope.itemList = null;

	/* Methods */
	// Global

	// Private

	// Scope Public
	$scope.filterTags = function() {
		$rootScope.editTags($NUChatTags.getTagList(), false);
	};

	/* Onload */
	RoomService.setCurrentRoom($stateParams.roomId);
	$scope.room = RoomService.getCurrentRoom();
}