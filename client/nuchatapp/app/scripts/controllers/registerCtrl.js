function RegisterCtrl($scope, User, $ionicPopup, $location) {
  console.log('RegisterCtrl')

  $scope.registration = {};

	/**
   * Redirect user to the app if already logged in
   */
  if (User.getCachedCurrent()!==null) {
    $location.path('/tab/dash');
  }

	/**
   * @name register()
   * @desctiption
   * register a new user and login
   */
  $scope.register = function () {
  	console.log('$scope.register')//
  	console.log('$scope.registration='+angular.toJson($scope.registration))//
    $scope.registration.created = new Date().toJSON();
    console.log($scope.registration)
    $scope.user = User.create($scope.registration)
    .$promise
    .then(function (res) {
      User.login({include: 'user', rememberMe: true}, $scope.registration)
      .$promise
      .then(function (res) {
        $location.path('/tab/friend')
      }, function (err) {
        $scope.loginError = err;
        $scope.showAlert(err.statusText, err.data.error.message);
      })

    }, function (err) {
      console.log(err)
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