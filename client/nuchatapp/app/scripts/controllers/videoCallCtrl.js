function VideoCallCtrl($scope, $state, $rootScope, $timeout, $ionicModal, $stateParams, signaling, SignalingService) {
  console.log('VideoCallCtrl')

    var duplicateMessages = [];

    $scope.callInProgress = false;

    $scope.isCalling = $stateParams.isCalling === 'true';
    $scope.contactName = $stateParams.contactName;

    $scope.allContacts = SignalingService.onlineUsers;
    console.log($scope.allContacts)//
    $scope.contacts = {};
    $scope.hideFromContactList = [$scope.contactName];
    $scope.muted = false;

    $ionicModal.fromTemplateUrl('templates/modals/select_contact.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.selectContactModal = modal;
    });

    if ($scope.isCalling) {
      console.log($scope.isCalling);//
      console.log('signaling.emit sendMessage:call');//
      console.log($stateParams.contactName);//
      signaling.emit('sendMessage', $stateParams.contactName, { type: 'call' });
    }

    function call(isInitiator, contactName) {
    	console.log('function call')//

      console.log(new Date().toString() + ': calling to ' + contactName + ', isInitiator: ' + isInitiator);

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

      console.log(config)

      var session = new cordova.plugins.phonertc.Session(config);
      
      session.on('sendMessage', function (data) {
        console.log('session.on sendMessage')//
        console.log('signaling.emit sendMessage')//
        console.log(JSON.stringify(data))
        signaling.emit('sendMessage', contactName, { 
          type: 'phonertc_handshake',
          data: JSON.stringify(data)
        });
      });

      session.on('answer', function () {
        console.log('session.on Answered!');
      });

      session.on('disconnect', function () {
        console.log('session.on disconnect');//
        if ($scope.contacts[contactName]) {
          console.log('$scope.contacts')
          delete $scope.contacts[contactName];
          console.log('$scope.contacts')
        }

        if (Object.keys($scope.contacts).length === 0) {
          signaling.emit('sendMessage', contactName, { type: 'ignore' });
          $state.go('tab.friends');
        }
      });

      console.log(session)//
      session.call();
      $scope.contacts[contactName] = session; 
      console.log($scope.contacts);//
    };//end call

    $scope.ignore = function () {
      console.log('$scope.ignore')
      var contactNames = Object.keys($scope.contacts);
      console.log(contactNames)
      if (contactNames.length > 0) { 
        $scope.contacts[contactNames[0]].disconnect();
      } else {
        console.log('signaling.emit sendMessage:ignore')
        signaling.emit('sendMessage', $stateParams.contactName, { type: 'ignore' });
        console.log('$state.go tab.friends')
        $state.go('tab.friends');
      }
    };

    $scope.end = function () {
      Object.keys($scope.contacts).forEach(function (contact) {
        $scope.contacts[contact].close();
        delete $scope.contacts[contact];
      });
    };

    $scope.answer = function () {
      console.log('$scope.answer')//
      if ($scope.callInProgress) { return; }

      $scope.callInProgress = true;
      $timeout($scope.updateVideoPosition, 1000);

      call(false, $stateParams.contactName);

      setTimeout(function () {
        console.log('sending answer');
        signaling.emit('sendMessage', $stateParams.contactName, { type: 'answer' });
      }, 1500);
    };

    $scope.updateVideoPosition = function () {
      $rootScope.$broadcast('videoView.updatePosition');
    };

    $scope.openSelectContactModal = function () {
      cordova.plugins.phonertc.hideVideoView();
      $scope.selectContactModal.show();
    };

    $scope.closeSelectContactModal = function () {
      cordova.plugins.phonertc.showVideoView();
      $scope.selectContactModal.hide();      
    };

    $scope.addContact = function (newContact) {
      console.log('addContact')
      console.log(newContact)
      $scope.hideFromContactList.push(newContact);
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

      Object.keys($scope.contacts).forEach(function (contact) {
        var session = $scope.contacts[contact];
        session.streams.audio = !$scope.muted;
        session.renegotiate();
      });
    };

    function onMessageReceive (name, message) {
    	console.log('onMessageReceive')
    	console.log(name)
    	console.log(message)

      switch (message.type) {
        case 'answer':
          console.log('message.type answer')
          $scope.$apply(function () {
            $scope.callInProgress = true;
            $timeout($scope.updateVideoPosition, 1000);
          });

          console.log($scope.contacts)
          var existingContacts = Object.keys($scope.contacts);
          console.log('existingContacts');
          console.log(existingContacts);

          if (existingContacts.length !== 0) {
            console.log('signaling.emit sendMessage add_to_group');//
            signaling.emit('sendMessage', name, {
              type: 'add_to_group',
              contacts: existingContacts,
              isInitiator: false
            });
          }

          call(true, name);
          break;

        case 'ignore':
          console.log('message.type ignore')
          var len = Object.keys($scope.contacts).length;
          console.log(len)
          if (len > 0) { 
            if ($scope.contacts[name]) {
              $scope.contacts[name].close();
              delete $scope.contacts[name];
            }

            var i = $scope.hideFromContactList.indexOf(name);
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
          console.log('message.type phonertc_handshake')
          if (duplicateMessages.indexOf(message.data) === -1) {
            console.log(message.data)
            console.log(name)
            console.log($scope.contacts)
            console.log($scope.contacts[name]);//session
            $scope.contacts[name].receiveMessage(JSON.parse(message.data));//session.receiveMessage
            duplicateMessages.push(message.data);
          }
          
          break;

        case 'add_to_group':
          console.log('add_to_group')
          message.contacts.forEach(function (contact) {
            $scope.hideFromContactList.push(contact);
            call(message.isInitiator, contact);

            if (!message.isInitiator) {
              $timeout(function () {
                signaling.emit('sendMessage', contact, { 
                  type: 'add_to_group',
                  contacts: [SignalingService.currentName],//???
                  isInitiator: true
                });
              }, 1500);
            }
          });

          break;
      } 
    };//

    signaling.on('messageReceived', onMessageReceive);

    $scope.$on('$destroy', function() { 
      signaling.removeListener('messageReceived', onMessageReceive);
    });
    
}