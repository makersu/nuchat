function DirectoryCtrl($scope, $rootScope, $stateParams, RoomService, $timeout, $NUChatTags) {
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
	// OnResume
	$scope.$on('$ionicView.enter', function() {

	});
}