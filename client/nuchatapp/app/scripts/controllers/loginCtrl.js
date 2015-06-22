function LoginCtrl($scope, $location, $ionicPopup, $ionicHistory, User, LBSocket, AccountService, FriendService, signaling, SignalingService, $state, $timeout) {
  console.log('LoginCtrl');

  /**
   * Redirect user to the app if already logged in
   */
  console.log(User.getCachedCurrent());
  if (User.getCachedCurrent()!==null) {
    FriendService.getAllFriends();//
    console.log('$state.go(tab.chats);');
    $state.go('tab.chats');
  }

  /**
   * Currently you need to initialiate the variables
   * you use whith ng-model. This seems to be a bug with
   * ionic creating a child scope for the ion-content directive
   */
  $scope.credentials = {};
  
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

        $scope.credentials={};
        
        AccountService.setAvatarUrl();

        FriendService.getAllFriends();

        console.log('self:join');//
        LBSocket.emit('self:join', User.getCachedCurrent().id);

        console.log('signaling.emit login');//
        signaling.emit('signalingLogin', User.getCachedCurrent().id);

        // $ionicHistory.nextViewOptions({disableBack: true, disableAnimate: true});//

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