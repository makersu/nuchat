'use strict';
angular.module('Nuchatapp.services', [])
.factory('FriendService', FriendService)
.factory('LBSocket', LBSocket)
.factory('RoomService', RoomService)
.factory('AccountService', AccountService)
.factory('$NUChatObject', ObjService)
.factory('$NUChatFiles', FileService)
.factory('$NUChatLinks', LinkService)
.factory('$NUChatDirectory', DirectoryService)
.factory('$NUChatTags', TagService)
.factory('$scrolls', ScrollService)
.factory('$imageFilters', ImageFilterService)
.factory('$utils', UtilService)
.factory('signaling', function (socketFactory,ENV) {
    console.log('signaling')
    var url='http://54.92.67.230:3000/';//aws
    // var url=ENV.BASE_URL
    console.log(url)
    var socket = io.connect(url);
    
    var socketFactory = socketFactory({
      ioSocket: socket
    });

    return socketFactory;
})
.factory('SignalingService', SignalingService)
// .factory('ContactsService', function (signaling) {
//   console.log('ContactsService')
//   var onlineUsers = [];

//   //addto onlineUsers if someone online
//   signaling.on('online', function (name) {
//     console.log('signaling.on online')
//     console.log(name)
//     if (onlineUsers.indexOf(name) === -1) {
//       onlineUsers.push(name);
//     }
//   });

//   //remove from onlineUsers if someone offline
//   signaling.on('signaling.on offline', function (name) {
//     var index = onlineUsers.indexOf(name);
//     if (index !== -1) {
//       onlineUsers.splice(index, 1);
//     }
//   });

//   return {
//     onlineUsers: onlineUsers,
//     setOnlineUsers: function (users, currentName) {
//       console.log('setOnlineUsers')
//       this.currentName = currentName;
      
//       onlineUsers.length = 0;
//       users.forEach(function (user) {
//         if (user !== currentName) {
//           onlineUsers.push(user);
//         }
//       });
//     }
//   }
// })
.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      console.log(key);
      console.log($window.localStorage[key]);
      return JSON.parse($window.localStorage[key] || null);
    },
    clear: function() {
      $window.localStorage.clear();
    }
  }
}]);