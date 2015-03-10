function DirArticleCtrl($scope, $rootScope, $state, $ionicModal) {
	/* Variables */
	// Private

	// Scope Public

	/* Methods */
	// Private
	// Scope Public
	$scope.openModal = function() {
		console.log('open');
		console.log($scope.modal);
		$scope.modal.show();
	};
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  // Override Global
  $rootScope.addDir = $scope.openModal;

	/* Onload */
	$scope.hideNavBar();
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