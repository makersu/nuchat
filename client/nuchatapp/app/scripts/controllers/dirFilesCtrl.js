function DirFilesCtrl($scope, $scrolls, $timeout) {
	/* Variables */
	// Private

	// Scope public

	/* Methods */

	/* Onload */
	$timeout(function() {
    $scrolls.bindScrollToFixed('.directory .scroll-content', '.flip');
  });
}