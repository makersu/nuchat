'use strict';
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('Nuchatapp', ['ionic', 'config',
    'Nuchatapp.controllers', 'Nuchatapp.services', 'Nuchatapp.filters', 'Nuchatapp.translate',
    'lbServices', 'angularMoment', 'monospaced.elastic', 'ngCordova'])
.run(function($ionicPlatform, $cordovaLocalNotification) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    // Registering app/activity events.
    document.addEventListener('resume', function() {
      $cordovaLocalNotification.cancelAll()
        .then(function() {
          console.log('OnResume: All local notifications have been canceled.');
        });
    });
  });
})
//.run(function ($rootScope, User) {
//  $rootScope.currentUser = User.getCurrent();
//  console.log($rootScope.currentUser)
//})    

.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    .state('register', {
    url: '/register',
    templateUrl: 'templates/register.html',
    controller: 'RegisterCtrl'
    })
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl'
    })

    // setup an abstract state for the tabs directive
    .state('tab', {
      url: '/tab',
      abstract: true,
      templateUrl: 'templates/tabs.html'
    })

    // Each tab has its own nav history stack:

    .state('tab.friends', {
      url: '/friends',
      views: {
        'tab-friends': {
          templateUrl: 'templates/tab-friends.html',
          controller: 'FriendCtrl'
        }
      }
    })

    .state('tab.friend-detail', {
      url: '/friend/:friendId',
      views: {
        'tab-friends': {
          templateUrl: 'templates/friend-detail.html',
          controller: 'FriendDetailCtrl'
        }
      }
    })

    .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'RoomCtrl'
        }
      }
    })

    .state('tab.createRoom', {
      url: '/createRoom',
      views: {
        'tab-chats': {
          templateUrl: 'templates/createRoom.html',
          controller: 'RoomCtrl'
        }
      }
    })

    .state('tab.chatRoom', {
      url: '/room/:roomId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chatRoom.html',
          controller: 'ChatCtrl'
        }
      },
      onExit: function($room) {
        $room.set(-1);
      }
    })

    .state('tab.dash', {
      url: '/dash',
      views: {
        'tab-dash': {
          templateUrl: 'templates/tab-dash.html',
          controller: 'DashCtrl'
        }
      }
    })

    .state('tab.account', {
      url: '/account',
      views: {
        'tab-account': {
          templateUrl: 'templates/tab-account.html',
          controller: 'AccountCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');//

  $httpProvider.interceptors.push(function ($q, $location) {
    return {
      responseError: function (rejection) {
        console.log("Redirect");
        console.log(rejection);
        if (rejection.status == 401 && $location.path() !== '/login' && $location.path() !== '/register') {
          $location.nextAfterLogin = $location.path();
          $location.path('/login');
        }
        return $q.reject(rejection);
      }
    };
  });

});

