function RegisterCtrl($scope, $ionicPopup, $location, User, LBSocket) {
  console.log('RegisterCtrl')

  $scope.registration = {};

	/**
   * Redirect user to the app if already logged in
   */
  console.log(User.getCachedCurrent());//
  if (User.getCachedCurrent()!==null) {
    $location.path('/tab/chats');
  }

	/**
   * @name register()
   * @desctiption
   * register a new user and login
   */
  $scope.register = function () {
    console.log($scope.registration)//
    $scope.user = User.create($scope.registration)
    .$promise
    .then(function (res) {
      User.login({include: 'user', rememberMe: true}, $scope.registration)
      .$promise
      .then(function (res) {
        $scope.registration={}
        LBSocket.emit('self:join', User.getCachedCurrent().id);
        $location.path('/tab/chats')
      }, function (err) {
        $scope.loginError = err;
        $scope.showAlert(err.statusText, err.data.error.message);
      })

    }, function (err) {
      console.log(err)//
      $scope.registerError = err;
      //TODO: if ERR_CONNECTION_REFUSED
      $scope.showAlert(err.statusText, err.data.error.message);
    });
  };

  /**
   * @name showAlert()
   * @param {string} title
   * @param  {string} errorMsg
   * @desctiption
   * Show a popup with the given parameters
   */
  $scope.showAlert = function (title, errorMsg) {
    console.log('showAlert')
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: errorMsg
    });
    alertPopup.then(function () {
      console.log($scope.loginError);
    });
  };

}