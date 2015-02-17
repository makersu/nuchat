function ChatCtrl($scope, $stateParams, User, Room, LBSocket, $room, $localstorage, $q,
            $ionicScrollDelegate, $gridMenu, $timeout, $cordovaCapture, METATYPE){
	console.log('ChatCtrl');
	console.log($stateParams.roomId);
  /* Variables */
  // Private
  var audioPlayer = null;
  var audioInterval = null;
  // Scope Public
	$scope.currentUser = User.getCurrent();
  $scope.input = {};
  $scope.messageAudioOptions = { 
    stop: { img: 'images/audiowave.png', icon: 'icon ion-play' }, 
    play: { img: 'images/audiowave.gif', icon: 'icon ion-pause' }
  }
  console.log($scope.currentUser);

  /* Methods */
  // Private
  var errorHandler = function(err) {
    console.error(err);
  };
  var playAudio = function(src) {
    var q = $q.defer();
    audioPlayer = new Media(src, onSuccess, errorHandler, onStatusChanged);
    // console.log('Initializing audio media successfully.');
    audioPlayer.play();
    function onSuccess() {
      console.log('onSuccess');
    }
    function onStatusChanged(status) {
      if (status == 4) { // Played (Stop);
        stopAudio();
        q.resolve();
      }
    }
    return q.promise;
  };
  var stopAudio = function() {
    console.log('stopAudio');
    if (audioPlayer) {
      audioPlayer.stop();
      audioPlayer.release();
      audioPlayer = null;
      console.log('Reset audio');
    }
  };
  // Scope Public
  $scope.joinRoom = function(id, switchRoom) {
    console.log(id)
    LBSocket.emit('room:join', id, function(room) {
      console.log(room)
      //LBSocket.emit('room:messages:get', id);
    });
  };
  $scope.sendMessage=function(sendMessageForm){
    console.log('sendMessage');

    //console.log($stateParams.roomId)
    //scope.input.room=$stateParams.roomId
    $scope.input.room = $scope.room;
    $scope.input.owner = $scope.currentUser.id;
    console.log($scope.input);

    LBSocket.emit('room:messages:new', $scope.input);
    $scope.input={};
    // Scrolling to the latest message.
    scrollHandle.scrollBottom();

    // Hiding meta menu
    if ($scope.showMetaMenu) {
      $scope.showMetaMenu = false;
    }
  };
  /* Grid Menu */
  $gridMenu.fromTemplateUrl('metamenu.html', {
    scope: $scope,
    hasHeader: true
  }).then(function(menu) {
    $scope.metaMenu = menu;
  });
  $scope.openMetaMenu = function() {
    $scope.metaMenu.show();
  };
  $scope.closeMetaMenu = function() {
    $scope.metaMenu.hide();
  };
  /* Choose files from device or cloud drive? */
  $scope.choosePhoto = function() {
    window.imagePicker.getPictures(
      function(results) {
        for (var i = 0; i < results.length; i++) {
          console.log('Image URI: ' + results[i]);
          $scope.input.text = results[i];
          $scope.sendMessage();
        }
      }, function (error) {
        console.error('Error: ' + error);
      }, {
        width: 800
      }
    );
  };
  $scope.capturePhoto = function() {
    $cordovaCapture.captureImage()
      .then(function(imgData) {
        $scope.input.text = imgData[0].fullPath;
        $scope.sendMessage();
        $scope.closeMetaMenu();
      }, errorHandler);
  };
  $scope.captureVoice = function() {
    $cordovaCapture.captureAudio()
      .then(function(audioData) {
        $scope.input.text = audioData[0].localURL;
        $scope.sendMessage();
        $scope.closeMetaMenu();
      }, errorHandler);
  };
  $scope.captureVideo = function() {
    $cordovaCapture.captureVideo()
      .then(function(videoData) {
        console.log(videoData);
        $scope.input.text = videoData[0].fullPath;
        $scope.sendMessage();
        $scope.closeMetaMenu();
      }, errorHandler);
  };
  // To edit the image message
  $scope.editImg = function(message) {
    $scope.editing = true;
    container = document.getElementById('msgContainer');
    $timeout(function() {
      var canvas = document.getElementById('imgCanvas');
      var context = canvas.getContext('2d');
      var imgObj = new Image();

      imgObj.onload = function() {
        console.log(container.offsetTop);
        canvas.parentNode.parentNode.style.top = container.offsetTop+'px';
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        context.drawImage(imgObj, 0, 0, imgObj.width, imgObj.height,
                                  0, 0, container.offsetWidth, container.offsetHeight);
      }
      imgObj.src = message.text;
    });
  };
  $scope.completeEdit = function() {
    $scope.editing = false;
  };
  /* Trigger functions */
  $scope.viewCalendar = function(callback) {
    $scope.selectTime = true;
    // Define the function on date changed.
    $scope.setDate = function(d) {
      $scope.selectTime = false;
      callback(d);
    };
  };

  /* OnLoad */
  // Getting the scroll delegate handle
  var scrollHandle = $ionicScrollDelegate.$getByHandle('userMessageScroll');
  // Scrolling to the top of unread in initial.
  scrollHandle.scrollBottom();
	//$scope.room = Room.findById({ id: $stateParams.roomId });
  $room.set($stateParams.roomId);
  $scope.room = $room.get();
	console.log($scope.room);

  // Reading unread messages from storage(or TODO: DB?)
  var unreadMessages = $localstorage.getObject($scope.room.id);
  if (unreadMessages) {
    $scope.room.messages = $scope.room.messages.concat(unreadMessages);
    $scope.room.unreadMessages = [];
    $localstorage.setObject($scope.room.id, []);
  }


	//
  // Chat actions
  //
	$scope.joinRoom($stateParams.roomId);
  // Triggers configuration.
  $scope.triggerOptions = {
    when: {
      trigger: '@',
      invoke: $scope.viewCalendar
    }
  };
  // Message: audio configuration.
  $scope.messageAudioOptions.stop.fn = stopAudio;
  $scope.messageAudioOptions.play.fn = playAudio;

    //this.sendMessage = function(message) {
    //    self.socket.emit('room:messages:new', message);
    //}

    //$scope.messages=room.messages;
/*
    LBSocket.on('room:messages:new', function(message) {
    	console.log('room:messages:new='+message)
    	//$scope.room.messages.push(message)
      $room.addMessage(message)

			//self.addMessage(message);

    });
*/
  var footerBar = document.body.querySelector('#userMessagesView .bar-footer');
  var scroller = document.body.querySelector('#userMessagesView .scroll-content');
  // I emit this event from the monospaced.elastic directive, read line 480
  $scope.$on('taResize', function(e, ta) {
    // console.log('taResize');
    if (!ta) return;
    
    var taHeight = ta[0].offsetHeight;
    // console.log('taHeight: ' + taHeight);
    
    if (!footerBar) return;
    
    var newFooterHeight = taHeight + 10;
    newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;
    
    footerBar.style.height = newFooterHeight + 'px';
    scroller.style.bottom = newFooterHeight + 'px'; 
  });

}	