function DirectoryCtrl($scope, $rootScope, $state, $stateParams, RoomService, $timeout, $NUChatTags, $scrolls) {
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
	$scope.$on('$ionicView.loaded', function() {
		$timeout(function() {
			// console.log('loaded view');
    	$scrolls.bindScrollToFixed('.directory .scroll-content', '.flip[nav-view="active"]');
		}, 500);
	});
}