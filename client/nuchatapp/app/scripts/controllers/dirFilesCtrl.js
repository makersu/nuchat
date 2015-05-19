function DirFilesCtrl($scope, $rootScope, $NUChatFiles, $NUChatTags, $scrolls, $filter, $ionicActionSheet, $checkFormat, ENV) {
	/* Variables */
	// Private

	// Scope public

	/* Methods */
	// Private
	var getOrderedFiles = function() {
		return $filter('orderBy')($NUChatFiles.getFiles($scope.room.messages), '-created');
	}
	// Scope public
	$scope.editTags = function(file) {
		$rootScope.editTags(file, true);
		file.isFlipped = false;
	};
	$scope.play = function(file) {
		$NUChatFiles.playFile(file);
	};
	$scope.edit = function(file) {
		$ionicActionSheet.show({
	   	buttons: [
	     	{ text: '<i class="icon ion-edit"></i> '+$filter('translate')('MANAGE_TAGS') },
	     	{ text: '<i class="icon ion-share"></i> '+$filter('translate')('SHARE') },
	   	],
	   	destructiveText: $filter('translate')('DELETE'),
	   	titleText: $filter('translate')('MANAGE_FILE'),
	   	cancelText: $filter('translate')('CANCEL'),
	   	cancel: function() {
	   		file.isFlipped = false;
	    },
	   	buttonClicked: function(index) {
	   		file.isFlipped = false;
	   		switch (index) {
	   			case 0:
	   				$rootScope.editTags(file, true);
	   				break;
	   			case 1:
	   				if ( $checkFormat.isImg(file.type) ) {
	   					window.plugins.socialsharing.share(null, null, ENV.GRIDFS_BASE_URL+file.originalFileId);
	   				} else {
	   					window.plugins.socialsharing.share(ENV.GRIDFS_BASE_URL+file.originalFileId);
	   				}
	   				break;
	   		}
	     	return true;
	   	}
	 	});
	};

	/* Onload */
	// Events
	$scope.$on('$ionicView.enter', function() {
		// console.log('enter directory file');
		$NUChatTags.setItemList($scope.fileList = getOrderedFiles());
		$scrolls.setContentContainer('.directory .view-container[nav-view="active"] .scroll-content');
		$scrolls.resize();

		// Rebinding the global functions
		$rootScope.filterImages = function() {
			$scope.fileList = $NUChatFiles.getImages( $NUChatTags.getFilteredList() );
		};
		$rootScope.filterVideos = function() {
			$scope.fileList = $NUChatFiles.getVideos( $NUChatTags.getFilteredList() );
		};
		$rootScope.filterAudios = function() {
			$scope.fileList = $NUChatFiles.getAudios( $NUChatTags.getFilteredList() );
		};
		$rootScope.reset = function() {
			$scope.fileList = $NUChatTags.getOriginalList();
		};
  });
  $scope.$on('onTagFiltered', function() {
		$scope.fileList = $NUChatTags.getFilteredList();
	});
}