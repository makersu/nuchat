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
// .factory('PouchService', PouchService)
//TODO: rename
// .factory('signaling', function (socketFactory,ENV) {
//     // console.log('signaling')
//     var url='http://140.123.4.17:3001/';
//     // var url='http://54.92.67.230:3000/';//aws
//     // var url=ENV.BASE_URL
//     console.log('signaling '+url)

//     // var socket = io.connect(url);
//     var socket = io(url, {
//       transports: [ 'websocket' ]
//     });
    
//     var socketFactory = socketFactory({
//       ioSocket: socket
//     });

//     return socketFactory;
// })
.factory('SignalingSocket', SignalingSocket)
.factory('SignalingService', SignalingService)
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