'use strict';
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('Nuchatapp', ['ionic', 'config', 'jangular.ui', 'jangular.mobile',
    'Nuchatapp.configs', 'Nuchatapp.controllers', 'Nuchatapp.services', 'Nuchatapp.filters', 'Nuchatapp.directives', 'Nuchatapp.translate', 'Nuchatapp.constants',
    'lbServices', 'angularMoment', 'monospaced.elastic', 'ngCordova', 'ui.bootstrap'])
.run(function($ionicPlatform, $filter, $cordovaLocalNotification, $rootScope, $ionicTabsDelegate, $animate,
    $ionicScrollDelegate, $timeout, $ionicNavBarDelegate, $ionicModal, $NUChatTags) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    // if(window.cordova && window.cordova.plugins.Keyboard) {
    //   cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    // }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    // Modal: To edit the tags of the message
    $rootScope.search = {};
    $ionicModal.fromTemplateUrl('templates/modals/modalTags.html', {
      scope: $rootScope
    }).then(function(modal) {
      $rootScope.tagModal = modal;
    });
    function clearSearchTags() {
      $rootScope.search = {};
    }
    $rootScope.editTags = function(message) {
      $rootScope.currentMsg = message;
      $rootScope.tagModal.show();
    };
    $rootScope.addTag = function() {
      $NUChatTags.add($rootScope.currentMsg, $rootScope.search.tag);
      clearSearchTags();
    };
    $rootScope.removeTag = function(idx) {
      $NUChatTags.remove($rootScope.currentMsg, idx);
      clearSearchTags();
    };
    $rootScope.closeTagsModal = function() {
      $rootScope.search = {};
      $rootScope.tagModal.hide();
    };

    // Registering app/activity events.
    document.addEventListener('resume', function() {
      cordova.plugins.notification.local.getTriggeredIds(function(ids) {
        console.log('OnResume: All triggered local notifications will be cleared.');
        cordova.plugins.notification.local.clear(ids);
      });
      $rootScope.isInBackground = false;
    });
    document.addEventListener('pause', function() {
      $rootScope.isInBackground = true;
    });
    // Listen to stateChangeSuccess event
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      var tabs = null;
      var tabHandles = $filter('filter')($ionicTabsDelegate.$getByHandle('chatDelegate')._instances, { $$delegateHandle: 'chatDelegate' });
      if (tabHandles.length) {
        tabs = tabHandles[0].$tabsElement;
      }
      if (tabs) {
        if (toState.name == 'tab.chatRoom' || toState.name.indexOf('tab.directory') == 0) { // Remove tabs.
          console.log('remove tabs');
          $animate.addClass(tabs, 'slideout');
            // Shifting the message bubbles upward.
          $timeout(function() {
            var scrollContent = null;
            var scrollHandles = $filter('filter')($ionicScrollDelegate.$getByHandle('userMessageScroll')._instances, { $$delegateHandle: 'userMessageScroll' });
            if (scrollHandles.length) {
              // console.log(scrollHandles);
              angular.forEach(scrollHandles, function(handle) {
                handle.$element.removeClass('has-tabs-top');
              });
            }
          });
          if (toState.name.indexOf('tab.directory') == 0) {
            $timeout(function() {
              $ionicNavBarDelegate.showBar(false);
            });
          }
        } else {  // Re-add tabs.
          $animate.removeClass(tabs, 'slideout');
        }
      }
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
      onExit: function(RoomService) {
        RoomService.set(-1);
      },
      cache: false
    })
    // Directory
    .state('tab.directory', {
      url: '/directory/:roomId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/directory.html',
          controller: 'DirectoryCtrl'
        }
      }
    })
    .state('tab.directory.article', {
      url: '/article',
      views: {
        'tab-article': {
          templateUrl: 'templates/dir-article.html',
          controller: 'DirArticleCtrl'
        }
      },
      cache: false
    })
    .state('tab.directory.files', {
      url: '/files',
      views: {
        'tab-files': {
          templateUrl: 'templates/dir-files.html',
          controller: 'DirFilesCtrl'
        }
      },
      cache: false
    })
    .state('tab.directory.links', {
      url: '/links',
      views: {
        'tab-links': {
          templateUrl: 'templates/dir-links.html',
          controller: 'DirLinksCtrl'
        }
      },
      cache: false
    })
    .state('tab.directory.calendar', {
      url: '/calendar',
      views: {
        'tab-calendar': {
          templateUrl: 'templates/dir-calendar.html',
          controller: 'DirCalendarCtrl'
        }
      },
      cache: false
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

