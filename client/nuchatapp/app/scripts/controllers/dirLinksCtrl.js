function DirLinksCtrl($scope, $NUChatLinks, $scrolls, $timeout, $filter) {
	/* Variables */
	// Private

	// Scope public

	/* Methods */
	// Private

	/* Onload */
	$scope.linkList = $filter('orderBy')($NUChatLinks.getLinks(), '-created');
	// Events
	$timeout(function() {
		$scrolls.bindScrollToFixed('.directory .scroll-content', '.flip');
	});
}