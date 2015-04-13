function DirArticleCtrl($scope, $rootScope, $ionicModal, $ionicPopover, $scrolls, $timeout, $NUChatObject, $compile) {
	/* Variables */
	// Private
  var $contentContainer = null;
  var _contentObjCount = 0;
  // var EventHandler = $famous['famous/core/EventHandler'];
	// Scope Public
  // $scope.scrollEventHandler = new EventHandler();
  $scope.article = [];
  $scope.editable = true;

	/* Methods */
	// Private
  function insertImgParagraph(imgs) {
    if (angular.isArray(imgs)) {
      angular.forEach(imgs, function(img) {
        $scope.article.push({type: 'img', content: img});
      });
    } else {
      $scope.article.push({type: 'img', content: imgs});
    }
    $scope.insertImgPopover.hide();
  }
  function insertAudioParagraph(audio) {
    $scope.article.push({type: 'audio', content: audio});
  }
  function errorHandler(err) {
    console.error(err);
  }
	// Scope Public
	$scope.openModal = function() {
    if (!$scope.modal) {
      $ionicModal.fromTemplateUrl('templates/modals/modalArticle.html', {
        scope: $scope,
      }).then(function(modal) {
        $scope.modal = modal;
        $scope.modal.show();
      });
    } else {
      $scope.modal.show();
    }
	};
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  $scope.insertImg = function($event) {
    if (!$scope.insertImgPopover) {
      $ionicPopover.fromTemplateUrl('insertImgPopover.html', {
        scope: $scope,
      }).then(function(popover) {
        $scope.insertImgPopover = popover;
        $scope.insertImgPopover.show($event);
      });
    } else {
      $scope.insertImgPopover.show($event);
    }
  };
  $scope.chooseImgs = function() {
    $NUChatObject.choosePhotos(insertImgParagraph, errorHandler);
  };
  $scope.captureImg = function() {
    $NUChatObject.capturePhoto(insertImgParagraph, errorHandler);
  };
  $scope.captureAudio = function() {
    $NUChatObject.captureAudio(insertAudioParagraph, errorHandler);
  };
  $scope.saveArticle = function() {
    console.log($scope.article);
    $scope.closeModal();
  };
  // Override Global
  $rootScope.addDir = $scope.openModal;

	/* Onload */
  $scope.$on('$ionicView.enter', function() {
    console.log('enter article view');
    $timeout(function() {
      $scrolls.bindScrollToFixed('.directory .view-container[nav-view="active"] .scroll-content', '.flip[nav-view="active"]');
    }, 1000);
  });
  // On modal shown.
  $scope.$on('modal.shown', function() {
    // Getting the content container.
    console.log(document.querySelector('.article'));
    $contentContainer = angular.element( document.querySelector('.article .scroll') );
  });
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
  	if ($scope.modal) {
  		$scope.modal.remove();
  	}
  });
}