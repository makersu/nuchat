function DirectoryCtrl($scope, $rootScope, $state, $stateParams, RoomService, $timeout) {
	/* Variables */
	// Private

	// Scope public
	$scope.expanded = false;

	/* Methods */
	// Global
	$rootScope.expandFunc = function() {
		console.log('expandFunc');
		$scope.expanded = !$scope.expanded;
		$timeout(function() {
			var addBtn = angular.element( document.querySelector('.button-float.add-one') );
			var tagBtn = angular.element( document.querySelector('.button-float.tags') );
			if ($scope.expanded) {
				addBtn.addClass('expand-left');
				tagBtn.addClass('expand-top');
			} else {
				addBtn.removeClass('expand-left');
				tagBtn.removeClass('expand-top');
			}
		});
	};
	$rootScope.addDir = {};
	// Private

	// Scope Public

	/* Onload */
	RoomService.set($stateParams.roomId);
	$scope.room = RoomService.get();
}