function LoginCtrl($scope, $location, $ionicPopup, $ionicHistory, User, LBSocket, AccountService, FriendService, signaling, SignalingService) {
  console.log('LoginCtrl');

  $scope.credentials = {};
  
  /**
   * Redirect user to the app if already logged in
   */
  console.log('User.getCachedCurrent()='+User.getCachedCurrent());//
  if (User.getCachedCurrent()!==null) {
    // Getting the friend list
    FriendService.getFriends();
    $location.path('/tab/chats');
  }

  /**
   * @name showAlert()
   * @param {string} title
   * @param  {string} errorMsg
   * @desctiption
   * Show a popup with the given parameters
   */
  $scope.showAlert = function (title, errorMsg) {
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: errorMsg
    });
    alertPopup.then(function (res) {
      console.log($scope.loginError);
    });
  };

	/**
   * @name login()
   * @description
   * sign-in function for users which created an account
   */
  $scope.login = function () {
    // console.log($scope.credentials);//
    $scope.loginResult = User.login({include: 'user', rememberMe: true}, $scope.credentials,
      function () {
        console.log('signaling.emit login');//
        // signaling.emit('login', User.getCachedCurrent().username);//
        // console.log(User.getCachedCurrent())
        // var user = { id: User.getCachedCurrent().id, name: User.getCachedCurrent().username}
        signaling.emit('login', User.getCachedCurrent().id);//


        $scope.credentials={};
        AccountService.setAvatarUrl();
        console.log('self:join');//
        LBSocket.emit('self:join', User.getCachedCurrent().id);//

        // Getting the friend list
        FriendService.getFriends();

        $ionicHistory.nextViewOptions({disableBack: true});//
        // console.log($location.nextAfterLogin)//
        var next = $location.nextAfterLogin || '/tab/chats';
        $location.nextAfterLogin = null;
        $location.path(next);
      },
      function (err) {
        $scope.loginError = err;
        $scope.showAlert(err.statusText, err.data.error.message);
      }
    );
  };

  $scope.goToRegister = function () {
    console.log('goToRegister');
    $location.path('register');
  };

  // signaling.on('login_error', function (message) {
  //     $scope.loading = false;
  //     var alertPopup = $ionicPopup.alert({
  //       title: 'Error',
  //       template: message
  //     });
  //   });

  // signaling.on('login_successful', function (users) {
  //   console.log('login_successful')
  //   console.log(users)
  //   SignalingService.setOnlineUsers(users, User.getCachedCurrent().username);
  //   // $state.go('app.contacts');
  // });

}