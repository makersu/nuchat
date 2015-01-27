angular.module('Nuchatapp.controllers')
    .controller('LoginCtrl', function ($scope, User, $location, $ionicPopup) {
    	console.log('LoginCtrl')

    	if (User.getCachedCurrent()!==null) {
    		$location.path('/tab/dash');
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
      	console.log($scope.credentials);
        $scope.loginResult = User.login({include: 'user', rememberMe: true}, $scope.credentials,
            function () {
                var next = $location.nextAfterLogin || '/tab/dash';
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
      	console.log('goToRegister')
          $location.path('register');
      };

    })