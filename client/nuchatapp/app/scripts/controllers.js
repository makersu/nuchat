'use strict';
angular.module('Nuchatapp.controllers', [])
.controller('LoginCtrl', LoginCtrl)
.controller('RegisterCtrl', RegisterCtrl)
.controller('AccountCtrl', AccountCtrl)
.controller('RoomCtrl', RoomCtrl)
.controller('ChatCtrl', ChatCtrl)
.controller('FriendCtrl', FriendCtrl)
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