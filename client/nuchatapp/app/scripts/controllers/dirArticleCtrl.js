function DirArticleCtrl($scope, $rootScope, $ionicModal, $ionicPopover, $ionicPopup, $scrolls, $timeout, $filter, $NUChatObject, $compile, $imageViewer, User, ENV) {
	/* Variables */
	// Private
  var $contentContainer = null;
  var _contentObjCount = 0;
  // var EventHandler = $famous['famous/core/EventHandler'];
	// Scope Public
  // $scope.scrollEventHandler = new EventHandler();
  $scope.articleList = [];
  $scope.article = { content: [] };
  $scope.editable = true;

	/* Methods */
	// Private
  function insertImgParagraph(imgs) {
    if (angular.isArray(imgs)) {
      angular.forEach(imgs, function(img) {
        $scope.article.content.push({type: 'img', content: img});
      });
    } else {
      $scope.article.content.push({type: 'img', content: imgs});
    }
    $scope.insertImgPopover.hide();
  }
  function insertAudioParagraph(audio) {
    $scope.article.content.push({type: 'audio', content: audio});
  }
  function insertVideoParagraph(video) {
    $scope.article.content.push({type: 'video', content: video});
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
  $scope.captureVideo = function() {
    $NUChatObject.captureVideo(insertVideoParagraph, errorHandler);
  };
  $scope.saveArticle = function() {
    if (!$scope.article.author) {
      $scope.article.author = User.getCachedCurrent();
      $scope.article.authorThumbnail = ENV.GRIDFS_BASE_URL+$scope.article.author.avatarThumbnail;
      $scope.article.posted = new Date();
      $scope.articleList.push($scope.article);
    } else {
      var idx = $scope.articleList.indexOf($scope.selected);
      $scope.articleList[idx] = $scope.article;
    }
    $scope.closeModal();
  };
  $scope.openArticleOption = function(article, $event) {
    $scope.selected = article;
    $scope.article = angular.copy(article);
    if (!$scope.editPopover) {
      $ionicPopover.fromTemplateUrl('editPopover.html', {
        scope: $scope,
      }).then(function(popover) {
        $scope.editPopover = popover;
        $scope.editPopover.show($event);
      });
    } else {
      $scope.editPopover.show($event);
    }
  };
  $scope.hideArticleOption = function() {
    $scope.editPopover.hide();
  };
  $scope.editArticle = function() {
    console.log('editArticle');
    $scope.hideArticleOption();
    $scope.openModal();
  };
  $scope.delArticle = function() {
    var idx = $scope.articleList.indexOf($scope.article);
    $scope.articleList.splice(idx, 1);
    $scope.hideArticleOption();
  };
  $scope.viewImgs = function(imgs, idx) {
    $imageViewer.show(imgs, idx, { imgSrcProp: 'content' });
  };
  $scope.editLink = function(isEdit) {
    $scope.data = {};
    var linkPopup = $ionicPopup.show({
      templateUrl: 'editLinkPopup.html',
      title: $filter('translate')(isEdit ? 'EDIT_LINK' : 'ADD_LINK'),
      scope: $scope,
      buttons: [
        { text: $filter('translate')('CANCEL') },
        {
          text: '<b>'+$filter('translate')('COMPLETE')+'</b>',
          type: 'button-royal',
          onTap: function(e) {
            console.log($scope.data.httpUrl);
            console.log($scope.data.httpsUrl);
            if ($scope.data.httpUrl) {
              return 'http://'+$scope.data.httpUrl;
            } else if ($scope.data.httpsUrl) {
              return 'https://'+$scope.data.httpsUrl;
            } else {
              return null;
            }
          }
        }
      ]
    }).then(function(result) {
      result && $scope.article.content.push({type: 'link', content: result});
    });
  };
  // Override Global
  $rootScope.addDir = function() {
    $scope.article = { content: [] };
    $scope.openModal();
  };

	/* Onload */
  $scope.articleOption = {
    img: {
      click: $scope.viewImgs,
    },
    link: {
      click: $rootScope.openInappbrowser,
    }
  };
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