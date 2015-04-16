function SignalingService($state, $ionicPopup, User, signaling) {
  console.log('SignalingService')
  var onlineUsers = [];

  signaling.on('login_error', function (message) {
    console.log('signaling.on login_error')
    var alertPopup = $ionicPopup.alert({
      title: 'Error',
      template: message
    });
  });

  signaling.on('login_successful', function (users) {
    console.log('signaling.on login_successful')
    console.log(users)
    setOnlineUsers(users, User.getCachedCurrent().username);
  });

  //addto onlineUsers if someone online
  signaling.on('online', function (name) {
    console.log('signaling.on online')
    console.log(name)
    if (onlineUsers.indexOf(name) === -1) {
      onlineUsers.push(name);
    }
  });

  //remove from onlineUsers if someone offline
  signaling.on('signaling.on offline', function (name) {
    var index = onlineUsers.indexOf(name);
    if (index !== -1) {
      onlineUsers.splice(index, 1);
    }
  });

  //receiving call
  signaling.on('messageReceived', function (name, message) {
    console.log('signaling.on messageReceived')
    console.log(message)
    switch (message.type) {
      case 'call':
        if ($state.current.name === 'videocall') { return; }
        console.log('$state.go videocall')
        $state.go('videocall', { isCalling: false, contactName: name });
        break;
    }
  });

  function setOnlineUsers(users, currentName) {
    console.log('setOnlineUsers')
    onlineUsers.length = 0;
    users.forEach(function (user) {
      if (user !== currentName) {
        onlineUsers.push(user);
      }
    });
    console.log(onlineUsers)
  }


  return {
    onlineUsers: onlineUsers,
    setOnlineUsers: setOnlineUsers
    // setOnlineUsers: function (users, currentName) {
    //   console.log('setOnlineUsers')
    //   this.currentName = currentName;
      
    //   onlineUsers.length = 0;
    //   users.forEach(function (user) {
    //     if (user !== currentName) {
    //       onlineUsers.push(user);
    //     }
    //   });
    // }
  }
}