function LoginCtrl($scope, $location, $ionicPopup, User, LBSocket) {
  console.log('LoginCtrl');

  $scope.credentials = {};
  
  /**
   * Redirect user to the app if already logged in
   */
  console.log(User.getCachedCurrent());//
  if (User.getCachedCurrent()!==null) {
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
    console.log($scope.credentials);//
    $scope.loginResult = User.login({include: 'user', rememberMe: true}, $scope.credentials,
      function () {
        $scope.credentials={}
        console.log('self:join');//
        LBSocket.emit('self:join', User.getCachedCurrent().id);

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

}