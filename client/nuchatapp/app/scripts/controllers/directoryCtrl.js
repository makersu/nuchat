function DirectoryCtrl($scope, $rootScope, $stateParams, RoomService, $filter, $NUChatTags, $ionicHistory, $ionicPopup) {
	/* Variables */
	// Private

	// Scope public
	$scope.itemList = null;

	/* Methods */
	// Global

	// Private

	// Scope Public
	$scope.filterTags = function() {
		$rootScope.editTags($NUChatTags.getTagList(), false);
	};
	$scope.toEditLink = function(scope, isEdit) {
    scope.data = {};
    var linkPopup = $ionicPopup.show({
      templateUrl: 'editLinkPopup.html',
      title: $filter('translate')(isEdit ? 'EDIT_LINK' : 'ADD_LINK'),
      cssClass: 'popup-link',
      scope: scope,
      buttons: [
        { text: $filter('translate')('CANCEL') },
        {
          text: '<b>'+$filter('translate')('COMPLETE')+'</b>',
          type: 'button-royal',
          onTap: function(e) {
            // console.log(scope.data.httpUrl);
            // console.log(scope.data.httpsUrl);
            if (scope.data.httpUrl) {
              return 'http://'+scope.data.httpUrl;
            } else if (scope.data.httpsUrl) {
              return 'https://'+scope.data.httpsUrl;
            } else {
              return null;
            }
          }
        }
      ]
    });
    return linkPopup;
  };

	/* Onload */
	RoomService.setCurrentRoom($stateParams.roomId);
	$scope.room = RoomService.getCurrentRoom();
	// OnResume
	$scope.$on('$ionicView.enter', function() {
		// console.log('enter directory');
		$scope.filterByType = $ionicHistory.currentStateName() === 'tab.directory.files';
	});
}