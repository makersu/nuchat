function AccountCtrl($scope, User, $location, $gridMenu, $NUChatObject, AccountService) {
  console.log('AccountCtrl')

    $scope.currentUser = AccountService.user
    console.log($scope.currentUser)

    // if($scope.currentUser.avatarThumbnail){
    //   console.log($scope.currentUser.avatarThumbnail)
    //   $scope.currentUser.avatarThumbnail=ENV.GRIDFS_BASE_URL+$scope.currentUser.avatarThumbnail
    //   console.log($scope.currentUser.avatarThumbnail)
    // }

  // $scope.avatar = function(avatarThumbnail){
  //   console.log(avatarThumbnail)
  //   var avatar='images/profile.png'
  //   if(avatarThumbnail){
  //     avatar = ENV.GRIDFS_BASE_URL+avatarThumbnail
  //   }
  //   console.log(avatar)
  //   return avatar
  // }

  /**
   * @name logout()
   * logout user and redirect to the login page
   */
  $scope.logout = function () {
    User.logout(function () {
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
        console.log(results)//
        if ($scope.metaMenu.isShown()) {
          $scope.closeMetaMenu();
        }
      }, errorHandler, {
        width: 800
      }
    );
  };
  $scope.captureAvatar = function() {
    $NUChatObject.captureAvatar(function(imgUri) {
      // $scope.input.text = imgUri;
      // $scope.sendMessage();
      if ($scope.metaMenu.isShown()) {
        $scope.closeMetaMenu();
      }
    }, errorHandler);
  };

}