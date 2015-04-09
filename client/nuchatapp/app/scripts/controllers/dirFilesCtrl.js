function DirFilesCtrl($scope, $rootScope, $NUChatFiles, $NUChatTags, $scrolls, $filter, ENV) {
	/* Variables */
	// Private

	// Scope public

	/* Methods */
	// Private
	var getOrderedFiles = function() {
		var list = $filter('orderBy')($NUChatFiles.getFiles(), '-created');
		angular.forEach(list, function(file) {
			if (file.thumbnailFileId && !file.thumbUrl) {
				file.thumbUrl = ENV.GRIDFS_BASE_URL+file.thumbnailFileId;
			}
		});
		return list;
	}
	// Scope public
	$scope.editTags = function(file) {
		$rootScope.editTags(file, true);
		file.isFlipped = false;
	};
	$scope.play = function(file) {

	};

	/* Onload */
	// Events
	$scope.$on('$ionicView.enter', function() {
		$NUChatTags.setItemList($scope.fileList = getOrderedFiles());
		$scrolls.setContentContainer('.directory .view-container[nav-view="active"] .scroll-content');
		$scrolls.resize();
  });
  $scope.$on('onTagFiltered', function() {
		$scope.fileList = $NUChatTags.getFilteredList();
	});
}