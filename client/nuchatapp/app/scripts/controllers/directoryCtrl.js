function DirectoryCtrl($scope, $rootScope, $stateParams, RoomService, $timeout, $NUChatTags, $ionicHistory) {
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
		// console.log('enter directory');
		$scope.filterByType = $ionicHistory.currentStateName() === 'tab.directory.files';
	});
}