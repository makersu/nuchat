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
	$NUChatTags.setItemList($scope.linkList = getOrderedLinks());
	// Events
	$timeout(function() {
		$scrolls.bindScrollToFixed('.directory .scroll-content', '.flip');
	});

	$scope.$on('onTagFiltered', function() {
		$scope.linkList = $NUChatTags.getFilteredList();
	});
}