function DirLinksCtrl($scope, $rootScope, $NUChatLinks, $NUChatTags, $scrolls, $timeout, $filter, RoomService) {
	/* Variables */
	// Private

	// Scope public

	/* Methods */
	// Private
	var getOrderedLinks = function() {
		return $filter('orderBy')($NUChatLinks.getLinks(), '-created');
	}
	// Scope public
	$scope.editTags = function(link) {
		$rootScope.editTags(link, true);
		link.isFlipped = false;
	}
	$scope.delLink = function(link) {
		// link.isFlipped = false;
		$NUChatLinks.remove(link.id);
		$scope.linkList = getOrderedLinks();
	};

	/* Onload */
	// Events
	$scope.$on('$ionicView.loaded', function() {
		// console.log('link view loaded');
	});
	$scope.$on('$ionicView.enter', function() {
		// console.log('enter link view');
		$NUChatTags.setItemList($scope.linkList = getOrderedLinks());
		$scrolls.setContentContainer('.directory .view-container[nav-view="active"] .scroll-content');
		$scrolls.resize();
	});

	$scope.$on('onTagFiltered', function() {
		$scope.linkList = $NUChatTags.getFilteredList();
	});
}