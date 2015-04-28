function VideoCallCtrl($scope, $state, $rootScope, $timeout, $ionicModal, $stateParams, signaling, SignalingService, User) {
  console.log('VideoCallCtrl');

  var duplicateMessages = [];

  $scope.callInProgress = false;

  $scope.isCalling = $stateParams.isCalling === 'true';
  
  $scope.contactTarget = angular.fromJson($stateParams.contactTarget);
  console.log($scope.contactTarget);

  $scope.allContacts = SignalingService.onlineUsers;
  console.log($scope.allContacts);

  $scope.contacts = {};
  $scope.hideFromContactList = [$scope.contactTarget.id];
  $scope.muted = false;

  function call(isInitiator, callee) {
    console.log('function call');//
    console.log(new Date().toString() + ': calling to ' + callee + ', isInitiator: ' + isInitiator);

    var config = { 
      isInitiator: isInitiator,
      turn: {
        host: 'turn:140.123.4.17:3478',
        username: 'mark',
        password: 'mark99'
      },
      streams: {
        audio: true,
        video: true
      }
    };

    console.log(config);

    var session = new cordova.plugins.phonertc.Session(config);

    //session.call() & session.close()
    session.on('sendMessage', function (data) {
      console.log('session.on sendMessage');//
      console.log(callee);//
      console.log(JSON.stringify(data));//
      console.log('*signaling.emit sendMessage phonertc_handshake');
      signaling.emit('sendMessage', callee, {
        type: 'phonertc_handshake',
        data: JSON.stringify(data)
      });
    });

    session.on('answer', function () {
      console.log('session.on Answered!');
    });

    //?session.close()
    session.on('disconnect', function () {
      console.log('session.on disconnect');
      console.log(callee);//
      //delete session
      if ($scope.contacts[callee]) {
        console.log($scope.contacts);//
        delete $scope.contacts[callee];
        console.log($scope.contacts);//
      }

      console.log(Object.keys($scope.contacts).length);//
      //sendMessage ignore
      if (Object.keys($scope.contacts).length === 0) {
        console.log('*signaling.emit sendMessage ignore');
        signaling.emit('sendMessage', callee, { type: 'ignore' });
        $state.go('tab.friends');
      }
    });

    session.call();

    console.log(session);//
    $scope.contacts[callee] = session;
    console.log($scope.contacts);//
  };//end call

  //3: callee ignore
  $scope.ignore = function () {
    console.log('$scope.ignore');
    var contactIds = Object.keys($scope.contacts);
    console.log(contactIds.length);//
    if (contactIds.length > 0) {
      console.log(contactIds[0]);//
      console.log($scope.contacts[contactIds[0]]);//
      console.log('session.disconnect()');//
      $scope.contacts[contactIds[0]].disconnect();
    } else {
      console.log('*signaling.emit sendMessage ignore');//
      signaling.emit('sendMessage', $scope.contactTarget.id, { type: 'ignore' });
      $state.go('tab.friends');
    }
  };

  //3: callee answer
  $scope.answer = function () {
    console.log('$scope.answer');//
    if ($scope.callInProgress) { return; }

    $scope.callInProgress = true;
    $timeout($scope.updateVideoPosition, 1000);
    console.log($scope.contactTarget.id);//
    call(false, $scope.contactTarget.id);

    setTimeout(function () {
      console.log('*signaling.emit sendMessage answer');
      signaling.emit('sendMessage', $scope.contactTarget.id, { type: 'answer' });
    }, 1500);
  };

  $scope.end = function () {
    console.log('$scope.end');
    console.log(Object.keys($scope.contacts));
    Object.keys($scope.contacts).forEach(function (contactId) {
      console.log(contactId);//
      $scope.contacts[contactId].close();
      delete $scope.contacts[contactId];
    });
  };

  $scope.updateVideoPosition = function () {
    $rootScope.$broadcast('videoView.updatePosition', { callInProgress: $scope.callInProgress });
  };

  $scope.openSelectContactModal = function () {
    console.log('openSelectContactModal');

    console.log(SignalingService.onlineFriends);
    


    cordova.plugins.phonertc.hideVideoView();
    $scope.selectContactModal.show();
  };

  $scope.closeSelectContactModal = function () {
    cordova.plugins.phonertc.showVideoView();
    $scope.selectContactModal.hide();
  };

  $scope.addContact = function (newContact) {
    console.log('addContact');
    console.log(newContact);
    $scope.hideFromContactList.push(newContact);
    console.log('*signaling.emit sendMessage call');
    signaling.emit('sendMessage', newContact, { type: 'call' });

    cordova.plugins.phonertc.showVideoView();
    $scope.selectContactModal.hide();
  };

  $scope.hideCurrentUsers = function () {
    return function (item) {
      return $scope.hideFromContactList.indexOf(item) === -1;
    };
  };

  $scope.toggleMute = function () {
    $scope.muted = !$scope.muted;

    Object.keys($scope.contacts).forEach(function (contactId) {
      var session = $scope.contacts[contactId];
      session.streams.audio = !$scope.muted;
      session.renegotiate();//?
    });
  };

  //4
  function onSignalingMessageReceived (fromUserId, message) {
    console.log('**onSignalingMessageReceived');
    console.log(fromUserId);//
    console.log(message);//

    switch (message.type) {
      case 'answer':
        console.log('message.type answer');
        $scope.$apply(function () {
          $scope.callInProgress = true;
          $timeout($scope.updateVideoPosition, 1000);
        });
        // console.log('$scope.contacts');//
        // console.log($scope.contacts);//
        var existingContacts = Object.keys($scope.contacts);
        // console.log('existingContacts');
        console.log(existingContacts);

        if (existingContacts.length !== 0) {
          console.log(fromUserId);//
          console.log('*signaling.emit sendMessage add_to_group');//
          signaling.emit('sendMessage', fromUserId, {
            type: 'add_to_group',
            contacts: existingContacts,
            isInitiator: false
          });
        }
        
        call(true, fromUserId);
        break;

      case 'ignore':
        console.log('message.type ignore');
        var len = Object.keys($scope.contacts).length;
        console.log(len);
        if (len > 0) { 
          if ($scope.contacts[fromUserId]) {
            $scope.contacts[fromUserId].close();
            delete $scope.contacts[fromUserId];
          }

          var i = $scope.hideFromContactList.indexOf(fromUserId);
          if (i > -1) {
            $scope.hideFromContactList.splice(i, 1);
          }

          if (Object.keys($scope.contacts).length === 0) {
            $state.go('tab.friends');
          }
        } else {
          $state.go('tab.friends');
        }

        break;

      case 'phonertc_handshake':
        console.log('message.type phonertc_handshake');
        if (duplicateMessages.indexOf(message.data) === -1) {
          console.log(message.data);//
          console.log(fromUserId);//
          console.log(Object.keys($scope.contacts));//
          $scope.contacts[fromUserId].receiveMessage(JSON.parse(message.data));//session.receiveMessage?
          duplicateMessages.push(message.data);
        }
        
        break;

      case 'add_to_group':
        console.log('add_to_group');
        message.contacts.forEach(function (contactId) {
          $scope.hideFromContactList.push(contactId);
          console.log(message.isInitiator);//
          console.log(contactId);//
          call(message.isInitiator, contactId);

          if (!message.isInitiator) {
            $timeout(function () {
              console.log('*signaling.emit sendMessage add_to_group')
              signaling.emit('sendMessage', contactId, { 
                type: 'add_to_group',
                contacts: [User.getCachedCurrent().id],//?
                isInitiator: true
              });
            }, 1500);
          }
        });

        break;
    }//end switch 
  };//end onSignalingMessageReceived

  /* Onload */
  if ($scope.isCalling) {
    console.log($scope.isCalling)//
    console.log('*signaling.emit sendMessage call')
    signaling.emit('sendMessage', $scope.contactTarget.id, { type: 'call' });//1
  };

  $ionicModal.fromTemplateUrl('templates/modals/select_contact.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.selectContactModal = modal;
  });
  // Events
  signaling.on('messageReceived', onSignalingMessageReceived);

  $scope.$on('$destroy', function() { 
    signaling.removeListener('messageReceived', onSignalingMessageReceived);//?
  });
    
}