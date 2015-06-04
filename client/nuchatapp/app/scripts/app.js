'use strict';
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('Nuchatapp', ['ionic', 'config', 'jangular.ui', 'jangular.mobile',
    'Nuchatapp.configs', 'Nuchatapp.controllers', 'Nuchatapp.services', 'Nuchatapp.filters', 'Nuchatapp.directives', 'Nuchatapp.translate', 'Nuchatapp.constants',
    'lbServices', 'angularMoment', 'monospaced.elastic', 'ngCordova', 'ui.bootstrap', 'ui.scroll', 'ui.scroll.jqlite', 'btford.socket-io', 'afkl.lazyImage'])
.run(function($ionicPlatform, $filter, $cordovaLocalNotification, $rootScope, $timeout, $ionicModal, $NUChatTags, $location, $ionicScrollDelegate, LBSocket, $cordovaCalendar) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true)
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    // InAppBrowser
    $rootScope.openInappbrowser = function(link, useSys) {
      window.open(link, useSys ? '_system' : '_blank', 'location=no,enableViewportScale=yes')
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
    $rootScope.editTags = function(message, manageTags) {
      if (!message) {
        console.error('No message to edit!');
        return
      }
      $rootScope.currentMsg = message;
      $rootScope.manageTags = manageTags || false;
      $rootScope.modalTagTitle = $rootScope.manageTags ? $filter('translate')('MANAGE_TAGS') : $filter('translate')('TAGS_FILTER');
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
    $rootScope.filterByTag = function() {
      $NUChatTags.filterList();
      $rootScope.$broadcast('onTagFiltered');
    };
    $rootScope.closeTagsModal = function() {
      $rootScope.search = {};
      $rootScope.tagModal.hide();
      $location.hash($rootScope.currentMsg.id);
      console.log($rootScope.currentMsg);//
      console.log('LBSocket.emit room:message:tags');
      LBSocket.emit('room:message:tags', $rootScope.currentMsg ,function(tags) { 
        console.log(tags);
      });
      $ionicScrollDelegate.anchorScroll();
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
      console.log('on $stateChangeSuccess');
      /** Moved to the $ionicView.enter event of the specified state controller. **/
      // var tabs = null;
      // var tabHandles = $filter('filter')($ionicTabsDelegate._instances, { $$delegateHandle: 'chatDelegate' });
      // if (tabHandles.length) {
      //   tabs = tabHandles[0].$tabsElement;
      // }
      // console.log(tabs);
      // if (tabs) {
      //   if (toState.name == 'tab.chatRoom' || toState.name.indexOf('tab.directory') == 0) { // Remove tabs.
      //     console.log('remove tabs');
      //     $animate.addClass(tabs, 'slideout');
      //       // Shifting the message bubbles upward.
      //     $timeout(function() {
      //       var scrollContent = null;
      //       var scrollHandles = $filter('filter')($ionicScrollDelegate.$getByHandle('userMessageScroll')._instances, { $$delegateHandle: 'userMessageScroll' });
      //       if (scrollHandles.length) {
      //         // console.log(scrollHandles);
      //         angular.forEach(scrollHandles, function(handle) {
      //           handle.$element.removeClass('has-tabs-top');
      //         });
      //       }
      //     });
      //     if (toState.name.indexOf('tab.directory') == 0) {
      //       $timeout(function() {
      //         $ionicNavBarDelegate.showBar(false);
      //       });
      //     }
      //   } else {  // Re-add tabs.
      //     $animate.removeClass(tabs, 'slideout');
      //   }
      // }
    });

    // $cordovaCalendar.createEvent({
    //   title: 'chatbox event created by Mark',
    //   location: 'The Moon',
    //   notes: 'Bring sandwiches',
    //   startDate: new Date(2015, 5, 22, 9, 0, 0, 0, 0),
    //   endDate: new Date(2015, 6, 15, 9, 0, 0, 0, 0)
    // }).then(function (result) {
    //   console.log("Event created successfully");
    // }, function (err) {
    //   console.error("There was an error: " + err);
    // });

  });
})
.run(function($ionicPlatform){
    ImgCache.options.debug = true;
    ImgCache.options.chromeQuota = 50*1024*1024;

    $ionicPlatform.ready(function() {
      ImgCache.init(function() {
          console.log('ImgCache init: success!');
      }, function(){
          console.log('ImgCache init: error! Check the log for errors');
      });
    });//end $ionicPlatform.ready
    
})
// .run(function ($state, signaling) {
    // signaling.on('messageReceived', function (name, message) {
    //   switch (message.type) {
    //     case 'call':
    //       if ($state.current.name === 'videocall') { return; }
    //       $state.go('videocall', { isCalling: false, contactName: name });
    //       break;
    //   }
    // });
  // })  
.config(function($stateProvider, $urlRouterProvider, $httpProvider, $ionicConfigProvider) {
  // Disable the swipe to go back.
  $ionicConfigProvider.views.swipeBackEnabled(false);

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
    .state('tab.calendars', {
      url: '/calendars',
      views: {
        'tab-calendars': {
          templateUrl: 'templates/tab-dash.html',
          controller: 'CalCtrl'
        }
      }
    })
    //
    .state('videocall', {
        url: '/videocall/:contactTarget?isCalling',
        controller: 'VideoCallCtrl',
        templateUrl: 'templates/videoCall.html',
        cache: false
    })
    //
    .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'RoomCtrl'
        }
      }
    })
    //
    .state('tab.createRoom', {
      url: '/createRoom',
      views: {
        'tab-chats': {
          templateUrl: 'templates/createRoom.html',
          controller: 'RoomCtrl'
        }
      }
    })
    //
    .state('tab.chatRoom', {
      url: '/room/:roomId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chatRoom.html',
          controller: 'ChatCtrl'
        }
      },
      onExit: function(RoomService) {
        RoomService.setCurrentRoom(-1);
      }
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
      }
    })
    .state('tab.directory.files', {
      url: '/files',
      views: {
        'tab-files': {
          templateUrl: 'templates/dir-files.html',
          controller: 'DirFilesCtrl'
        }
      }
    })
    .state('tab.directory.links', {
      url: '/links',
      views: {
        'tab-links': {
          templateUrl: 'templates/dir-links.html',
          controller: 'DirLinksCtrl'
        }
      }
    })
    .state('tab.directory.calendar', {
      url: '/calendar',
      views: {
        'tab-calendar': {
          templateUrl: 'templates/dir-calendar.html',
          controller: 'DirCalendarCtrl'
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

