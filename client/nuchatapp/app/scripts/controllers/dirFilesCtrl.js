function DirFilesCtrl($scope, $rootScope, $NUChatFiles, $NUChatTags, $NUChatObject, $scrolls, $filter, $ionicActionSheet, $checkFormat, $gridMenu, ENV, LBSocket, $ionicLoading) {
	/* Variables */
	// Private

	// Scope public

	/* Methods */
	// Private
	function errorHandler(err) {
		console.error(err);
	}
	function showUploading() {
		$ionicLoading.show({
  		template: '<ion-spinner icon="spiral"></ion-spinner> '+$filter('translate')('UPLOADING')
  	});
	}
	function hideUploading() {
		$ionicLoading.hide();
	}
	function getOrderedFiles() {
		return $filter('orderBy')($NUChatFiles.getFiles($scope.room.messages), '-created');
	};
	function refreshList() {
		console.log($scope.room);
		$NUChatTags.setItemList($scope.fileList = getOrderedFiles());
	}
	function addFiles() {
		$scope.openMetaMenu();
	}
	// Scope public
	/* Choose files from device or cloud drive? */
  $scope.choosePhoto = function() {
    $NUChatObject.choosePhotosUpload(
      function(results) {
      	showUploading();
        $scope.closeMetaMenu();
      }, errorHandler, {
        width: 640
      }
    );
  };
  $scope.capturePhoto = function() {
    $NUChatObject.capturePhotoUpload(function(msg) {
    	showUploading();
      $scope.closeMetaMenu();
    }, errorHandler);
  };
  $scope.captureVoice = function() {
    $NUChatObject.captureAudioUpload(function(msg) {
    	showUploading();
      $scope.closeMetaMenu();
    }, errorHandler);
  };
  $scope.captureVideo = function() {
    $NUChatObject.captureVideoUpload(function(msg) {
    	showUploading();
      $scope.closeMetaMenu();
    }, errorHandler)
  };
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
	     	{ text: '<i class="icon ion-ios-star"></i> '+$filter('translate')('STAR') },
	     	{ text: '<i class="icon ion-share"></i> '+$filter('translate')('SHARE') },
	   	],
	   	// destructiveText: $filter('translate')('DELETE'),
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
	   				$NUChatTags.setFavorite(file);
	   				break;
	   			case 2:
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
		// $NUChatTags.setItemList($scope.fileList = getOrderedFiles());
		refreshList();
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
		$rootScope.addDir = addFiles;

		/* Grid Menu */
	  $scope.openMetaMenu = function() {
	  	if (!$scope.metaMenu) {
		    $gridMenu.fromTemplateUrl('metamenu.html', {
		      scope: $scope,
		      position: 'bottom'
		    }).then(function(menu) {
		      $scope.metaMenu = menu;
		      $scope.metaMenu.show();
		    });
		  } else {
		  	$scope.metaMenu.show();
		  }
	  };
	  $scope.closeMetaMenu = function() {
	    $scope.metaMenu.hide();
	  };
  });
  $scope.$on('onTagFiltered', function() {
		$scope.fileList = $NUChatTags.getFilteredList();
	});
	LBSocket.on('room:messages:new', function(newMsg) {
		$scope.room.messages[newMsg.message.id] = newMsg.message;
		console.log($scope.room.messages);
    refreshList();
    hideUploading();
	});
}