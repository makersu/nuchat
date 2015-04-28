function SignalingService($state, $ionicPopup, User, signaling, FriendService) {
  console.log('SignalingService')
  var onlineUsers = [];
  var onlineFriends = [];

  signaling.on('login_error', function (message) {
    console.log('signaling.on login_error');
    var alertPopup = $ionicPopup.alert({
      title: 'Error',
      template: message
    });
  });

  signaling.on('login_successful', function (users) {
    console.log('signaling.on login_successful');
    console.log(users);
    setOnlineUsers(users, User.getCachedCurrent().id);
  });

  //addto onlineUsers if someone online
  signaling.on('online', function (userId) {
    console.log('signaling.on online');
    console.log(userId);
    console.log(onlineUsers);
    if (onlineUsers.indexOf(userId) === -1) {
      onlineUsers.push(userId);
    }
    console.log(onlineUsers);

    //???
    // console.log(FriendService.friends);
    var friendIds = Object.keys(FriendService.friends);
    console.log(friendIds);
    if ( friendIds.indexOf(userId) != -1 && onlineFriends.indexOf(userId) === -1 ) {
        onlineFriends.push(userId);
    }
    console.log(onlineFriends);

  });

  //remove from onlineUsers if someone offline
  //TODO: if someone offline on call?
  signaling.on('offline', function (userId) {
    console.log('signaling.on offline');
    console.log(userId);
    var index = onlineUsers.indexOf(userId);
    if (index !== -1) {
      onlineUsers.splice(index, 1);
    }
    console.log(onlineUsers);

    if (onlineFriends.indexOf(userId) !== -1) {
      onlineFriends.splice(index, 1);
    }
    console.log(onlineFriends);

  });

  //receiving call //2
  signaling.on('messageReceived', function (fromUserId, message) {
    console.log('signaling.on messageReceived');
    switch (message.type) {
      case 'call':
        if ($state.current.name === 'videocall') { return; }
        console.log('$state.go videocall');
        $state.go('videocall', { isCalling: false, contactTarget: angular.toJson({ id: fromUserId }) });//
        break;
    }
  });

  function setOnlineUsers(users, userId) {
    console.log('setOnlineUsers');
    console.log(userId);

    onlineUsers.length = 0;
    users.forEach(function (user) {
      if (user !== userId) {
        onlineUsers.push(user);
      }
    });
    console.log(onlineUsers);
  }


  return {
    onlineUsers: onlineUsers,
    onlineFriends: onlineFriends,
    setOnlineUsers: setOnlineUsers
  };
}