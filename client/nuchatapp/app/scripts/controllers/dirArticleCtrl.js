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
  $timeout(function() {
    $scrolls.bindScrollToFixed('.directory .scroll-content', '.flip');
  }, 500);
	$ionicModal.fromTemplateUrl('templates/modals/modalArticle.html', {
    scope: $scope,
  }).then(function(modal) {
    $scope.modal = modal;
  });
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
  	if ($scope.modal) {
  		$scope.modal.remove();
  	}
  });
}