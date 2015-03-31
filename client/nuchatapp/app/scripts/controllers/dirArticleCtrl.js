function DirArticleCtrl($scope, $rootScope, $ionicModal, $scrolls, $timeout) {
	/* Variables */
	// Private
  // var EventHandler = $famous['famous/core/EventHandler'];
	// Scope Public
  // $scope.scrollEventHandler = new EventHandler();
  $scope.article = {};

	/* Methods */
	// Private
	// Scope Public
	$scope.openModal = function() {
		$scope.modal.show();
	};
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  $scope.saveArticle = function() {
    console.log($scope.article);
    $scope.closeModal();
  };
  // Override Global
  $rootScope.addDir = $scope.openModal;

	/* Onload */
	$ionicModal.fromTemplateUrl('templates/modals/modalArticle.html', {
    scope: $scope,
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.$on('$ionicView.loaded', function() {
    $timeout(function() {
      // console.log('article view loaded');
      $scrolls.setContentContainer('.directory .view-container[nav-view="active"] .scroll-content');
      $scrolls.reset();
    }, 500);
  });
  $scope.$on('$ionicView.enter', function() {
    // console.log('enter article view');
    $scrolls.setContentContainer('.directory .view-container[nav-view="active"] .scroll-content');
  });
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
  	if ($scope.modal) {
  		$scope.modal.remove();
  	}
  });
}