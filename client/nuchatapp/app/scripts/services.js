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