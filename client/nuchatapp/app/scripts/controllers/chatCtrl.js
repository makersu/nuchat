function ChatCtrl($scope, $state, $stateParams, User, Room, LBSocket, RoomService, $localstorage, $q, $filter,
            $ionicScrollDelegate, $gridMenu, $timeout, $NUChatObject, METATYPE, ENV){
	console.log('ChatCtrl');
	console.log($stateParams.roomId);
  /* Variables */
  // Private
  var audioPlayer = null;
  var audioInterval = null;
  // Scope Public
	$scope.currentUser = User.getCachedCurrent();
  $scope.input = {};
  $scope.messageOptions = {
    audioSetting: { 
      stop: { img: 'images/audiowave.png', icon: 'icon ion-play' }, 
      play: { img: 'images/audiowave.gif', icon: 'icon ion-pause' }
    },
    remote: ENV.GRIDFS_BASE_URL,
  };
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
    $scope.input.roomId = $scope.room.id;
    $scope.input.ownerId = $scope.currentUser.id;
    console.log($scope.input);

    LBSocket.emit('room:messages:new', $scope.input);
    $scope.input={};

    if ($scope.metaMenu.isShown()) {
      $scope.closeMetaMenu();
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
    $NUChatObject.choosePhotos(
      function(results) {
        if ($scope.metaMenu.isShown()) {
          $scope.closeMetaMenu();
        }
        // for (var i = 0; i < results.length; i++) {
        //   console.log('Image URI: ' + results[i]);
          
        //   // $scope.input.text = results[i];
        //   //$scope.sendMessage();

        //   console.log(cordova.file.cacheDirectory)


        //   //window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + "www/index.html", gotFile, fail);

        //   window.resolveLocalFileSystemURL(
        //     results[i], 
        //     function(fileEntry){
        //       console.log(fileEntry)
              
        //       fileEntry.file(function(file) {
        //         console.log(file)
        //         var reader = new FileReader();

        //         reader.onloadend = function(event) {
        //           console.log('onload')
        //           //console.log(event.target)
        //           console.log('room:files:new')
        //           var data={}
        //           data.roomId = $scope.room.id;
        //           data.ownerId = $scope.currentUser.id;
        //           data.file=event.target.result
        //           data.filename=file.name
        //           data.type=file.type
        //           data.size=file.size
        //           console.log(data)      
     
        //           //LBSocket.emit('room:files:new', {image:event.target.result, room:$scope.room, ownerId: $scope.currentUser.id });
        //           LBSocket.emit('room:files:new', data);
        //           $scope.input={};

        //           if ($scope.metaMenu.isShown()) {
        //             $scope.closeMetaMenu();
        //           }

        //         }

        //         //reader.readAsDataURL(file);
        //         reader.readAsArrayBuffer(file);


        //       });
        //     }, 
        //     function(error){
        //       console.log(error)
        //     }
        //   );//end resolveLocalFileSystemURL


        // }
      }, errorHandler, {
        width: 800
      }
    );
  };
  $scope.capturePhoto = function() {
    $NUChatObject.capturePhoto(function(imgUri) {
      // $scope.input.text = imgUri;
      // $scope.sendMessage();
      if ($scope.metaMenu.isShown()) {
        $scope.closeMetaMenu();
      }
    }, errorHandler);
  };
  $scope.captureVoice = function() {
    $NUChatObject.captureAudio(function(audioUri) {
      // $scope.input.text = audioUri;
      // $scope.sendMessage();
      if ($scope.metaMenu.isShown()) {
        $scope.closeMetaMenu();
      }
    }, errorHandler);
  };
  $scope.captureVideo = function() {
    $NUChatObject.captureVideo(function(videoUri) {
      // $scope.input.text = videoUri;
      // $scope.sendMessage();
      if ($scope.metaMenu.isShown()) {
        $scope.closeMetaMenu();
      }
    }, errorHandler)
  };
  // To edit the image message
  $scope.editImg = function(message) {
    console.log(message.type);
    // console.log(message.type == METATYPE.IMG);
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
	//$scope.room = Room.findById({ id: $stateParams.roomId });
  RoomService.set($stateParams.roomId);
  $scope.room = RoomService.get();

  // Initializing NUChatObject service
  $NUChatObject.init($scope.room, $scope.currentUser);

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
  $scope.messageOptions.audioSetting.stop.fn = stopAudio;
  $scope.messageOptions.audioSetting.play.fn = playAudio;

  // Watchers
  $scope.$watchCollection('room.messages', function(newVal, oldVal) {
    $scope.room.groupedMessages = $filter('groupBy')($scope.room.messages, 'created', function(msg) {
      return $filter('amChatGrouping')(msg.created);
    });
  });

  // Register event listeners
  $scope.$on('onNewMessage', function() {
    $timeout(function() {
      // Scrolling to the latest message.
      scrollHandle.scrollBottom();
      $timeout(function() {
        // For the late loading...
        scrollHandle.scrollBottom();
      }, 1000);
    }, 500);
  });

    //this.sendMessage = function(message) {
    //    self.socket.emit('room:messages:new', message);
    //}

    //$scope.messages=room.messages;
/*
    LBSocket.on('room:messages:new', function(message) {
    	console.log('room:messages:new='+message)
    	//$scope.room.messages.push(message)
      RoomService.addMessage(message)

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

  // Getting the scroll delegate handle
  var scrollHandle = $ionicScrollDelegate.$getByHandle('userMessageScroll');
  $timeout(function() {
    // Scrolling to the top of unread in initial.
    scrollHandle.scrollBottom();
    // console.log('scroll bottom');
  });

}	