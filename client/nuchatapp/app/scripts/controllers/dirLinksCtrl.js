function DirLinksCtrl($scope, $NUChatLinks, $scrolls, $timeout, $filter, RoomService) {
	/* Variables */
	// Private

	// Scope public

	/* Methods */
	// Private
	// Scope public
	$scope.delLink = function(link) {

	}

	/* Onload */
	$scope.linkList = $filter('orderBy')($NUChatLinks.getLinks(), '-created');
	// Events
	$timeout(function() {
		$scrolls.bindScrollToFixed('.directory .scroll-content', '.flip');
	});
}