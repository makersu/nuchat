'use strict';
angular.module('Nuchatapp.controllers', [])
.controller('LoginCtrl', LoginCtrl)
.controller('RegisterCtrl', RegisterCtrl)
.controller('AccountCtrl', AccountCtrl)
.controller('RoomCtrl', RoomCtrl)
.controller('ChatCtrl', ChatCtrl)
.controller('FriendDetailCtrl', function($scope, $stateParams, FriendService) {
	console.log('FriendDetailCtrl')
	console.log($stateParams.friendId)
  $scope.friend = FriendService.get($stateParams.friendId);
})
// fitlers
.filter('nl2br', ['$filter',
  function($filter) {
    return function(data) {
    	console.log('data='+data)
      if (!data) return data;
      return data.replace(/\n\r?/g, '<br />');
    };
  }
])