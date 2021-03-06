function AccountCtrl($scope, User, $location, $gridMenu, $NUChatObject, AccountService, User, ENV, RoomService, FriendService, $ionicTabsDelegate, $animate, $filter) {
  console.log('AccountCtrl')

  function slideinTabs() {
    var tabs = null;
    var tabHandles = $filter('filter')($ionicTabsDelegate._instances, { $$delegateHandle: 'chatDelegate' });
    if (tabHandles.length) {
      tabs = tabHandles[0].$tabsElement;
      if (tabs) {
        // Re-add tabs.
        $animate.removeClass(tabs, 'slideout');
      }
    }
  }

  /**
   * @name logout()
   * logout user and redirect to the login page
   */
  $scope.logout = function () {
    User.logout(function () {
      RoomService.removeAll();
      FriendService.removeAll();
    	$location.path('/login');
    });
  }

  /* Grid Menu */
  $gridMenu.fromTemplateUrl('metamenu.html', {
    scope: $scope,
    hasHeader: true
  }).then(function(menu) {
    $scope.metaMenu = menu;
  });

  $scope.openMetaMenu = function() {
    $scope.metaMenu.show();
  };

  $scope.closeMetaMenu = function() {
    $scope.metaMenu.hide();
  };

  var errorHandler = function(err) {
    console.error(err);
  };

  /* Choose files from device or cloud drive? */
  $scope.chooseAvatar = function() {
    console.log('chooseAvatar')
    $NUChatObject.chooseAvatar(
      function(results) {
        if ($scope.metaMenu.isShown()) {
          $scope.closeMetaMenu();
        }
      }, errorHandler, {
        targetWidth: 800,
        targetHeight: 800
      }
    );
  };
  
  $scope.captureAvatar = function() {
    $NUChatObject.captureAvatar(function(imgUri) {
      if ($scope.metaMenu.isShown()) {
        $scope.closeMetaMenu();
      }
    }, errorHandler);
  };

  /* Onload */
  // Life Cycle
  $scope.$on('$ionicView.enter', function() {
    slideinTabs();
    $scope.currentUser = User.getCachedCurrent();
  });
  // Regitsterint watchers
  $scope.$watch(
    function() { return AccountService.getAvatarUrl() },
    function(newVal) {
      $scope.avatarUrl = newVal;
      console.log($scope.avatarUrl)
    }
  );
}