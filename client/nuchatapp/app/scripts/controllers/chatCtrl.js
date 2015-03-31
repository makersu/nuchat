function ChatCtrl($scope, $rootScope, $state, $stateParams, User, LBSocket, RoomService, $localstorage, $q, $filter,
            $ionicScrollDelegate, $gridMenu, $timeout, $NUChatObject, $NUChatDirectory, $NUChatLinks, $NUChatTags, METATYPE, ENV,
            $ionicModal, $location, $utils, FriendService) {

	console.log('ChatCtrl');
	console.log($stateParams.roomId);
  RoomService.getRoomMessages($stateParams.roomId)
  $scope.friends=FriendService.getAll();

  // var data = {}
  // data.roomId=$stateParams.roomId
  // var lastMessage= RoomService.getLastMessage($stateParams.roomId)
  // if(lastMessage && lastMessage.id){
  //  data.messageId = lastMessage.id
  // }
  // console.log(data)

  // LBSocket.emit('room:messages:get', data , function(messages){
  //   console.log('room:messages:get')
  //   //console.log(messages)
  //   console.log(messages.messages.length)
  //   for(var i=0;i<messages.messages.length;i++){
  //    RoomService.addMessage(messages.messages[i])
  //   }
  // });
    
  /* Variables */
  // Private
  var audioPlayer = null;
  var audioInterval = null;
  var prevLatestMsg = null;
  // Scope Public
	$scope.currentUser = User.getCachedCurrent();
  console.log($scope.currentUser)//
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
  // $scope.joinRoom = function(id, switchRoom) {
  //   console.log(id)
  //   LBSocket.emit('room:join', id, function(room) {
  //     console.log(room)
  //     //LBSocket.emit('room:messages:get', id);
  //   });
  // };
  $scope.sendMessage=function(sendMessageForm){
    console.log('sendMessage');

    //console.log($stateParams.roomId)
    //scope.input.room=$stateParams.roomId
    $scope.input.roomId = $scope.room.id;
    $scope.input.ownerId = $scope.currentUser.id;
    console.log($scope.input);

    //LBSocket.emit('room:messages:new', $scope.input);
    RoomService.createMessage($scope.input)

    $scope.input={};

    if ($scope.metaMenu.isShown()) {
      $scope.closeMetaMenu();
    }
  };

  // Grouping
  $scope.collapseGroup = function(group) {
    group.open = false;
    $location.hash(group.name);
    scrollHandle.anchorScroll();
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
    $NUChatObject.choosePhotosUpload(
      function(results) {
        if ($scope.metaMenu.isShown()) {
          $scope.closeMetaMenu();
        }
      }, errorHandler, {
        width: 800
      }
    );
  };
  $scope.capturePhoto = function() {
    $NUChatObject.capturePhotoUpload(function(imgUri) {
      // $scope.input.text = imgUri;
      // $scope.sendMessage();
      if ($scope.metaMenu.isShown()) {
        $scope.closeMetaMenu();
      }
    }, errorHandler);
  };
  $scope.captureVoice = function() {
    $NUChatObject.captureAudioUpload(function(audioUri) {
      // $scope.input.text = audioUri;
      // $scope.sendMessage();
      if ($scope.metaMenu.isShown()) {
        $scope.closeMetaMenu();
      }
    }, errorHandler);
  };
  $scope.captureVideo = function() {
    $NUChatObject.captureVideoUpload(function(videoUri) {
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
      imgObj.src = ENV.GRIDFS_BASE_URL+message.thumbnailFileId;
    });
  };
  $scope.completeEdit = function() {
    $scope.editing = false;
  };

  /* Tags functions */
  $scope.editTags = function(msg) {
    $rootScope.editTags(msg, true);
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

  /* Events */
  $scope.checkScroll = function() {
    var bound = scrollHandle.element.scrollHeight;
    var lastGroup = $scope.room.groupedMessages[$scope.room.groupedMessages.length-1];
    if ( lastGroup.open && scrollHandle.getScrollPosition().top >= (bound/2) ) {
      $scope.clearNotification();
    }
  };

  /* Inline Notification */
  $scope.clearNotification = function() {
    $scope.$apply(function() {
      $scope.notify = false;
    });
  };

  /* OnLoad */
	//$scope.room = Room.findById({ id: $stateParams.roomId });
  RoomService.setCurrentRoom($stateParams.roomId);
  $scope.room = RoomService.getCurrentRoom();
  $scope.room.groupedMessages = $filter('groupBy')($scope.room.messages, 'created', function(msg) {
    return $filter('amChatGrouping')(msg.created);
  });
  console.log('enter controller');
  console.log($scope.room)//

  // Initializing NUChatObject service
  $NUChatObject.init($scope.room, $scope.currentUser);

  // Reset the NUChatLinks
  $NUChatLinks.reset();

  // Reading unread messages from storage(or TODO: DB?)
  // var unreadMessages = $localstorage.getObject($scope.room.id);
  // console.log(unreadMessages)//
  // if (unreadMessages) {
  //   $scope.room.messages = $scope.room.messages.concat(unreadMessages);
  //   $scope.room.unreadMessages = [];
  //   $localstorage.setObject($scope.room.id, []);
  // }


	//
  // Chat actions
  //
	//$scope.joinRoom($stateParams.roomId);
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
  // $scope.$watchCollection('room.messages', function(newVal, oldVal) {
  //   if (newVal) {
  //     // Only refreshing the group when passing a new date.
  //     console.log(newVal);
  //     console.log(newVal[newVal.length-1]);
  //     console.log(newVal[newVal.length-1].created);
  //     if ( newVal.length > 1 && $utils.diffDate(newVal[newVal.length-1].created, newVal[newVal.length-2].created) ) {
  //       $scope.room.groupedMessages = $filter('groupBy')(newVal, 'created', function(msg) {
  //         return $filter('amChatGrouping')(msg.created);
  //       });
  //       // Open the latest group.
  //       if ($scope.room.groupedMessages.length > 0) {
  //         $scope.room.groupedMessages[$scope.room.groupedMessages.length-1].open = true;
  //       }
  //     }
  //   }
  // });

  // Register event listeners
  $scope.$on('onNewMessage', function(event, args) {

    if ( prevLatestMsg && !$utils.sameDate(args.msg.created, prevLatestMsg.created) ) {
      var msgs = {};
      msgs[args.msg.id] = args.msg;
      var newGroup = $filter('groupBy')(msgs, 'created', function(msg) {
          return $filter('amChatGrouping')(msg.created);
      });
      $scope.room.groupedMessages = $scope.room.groupedMessages.concat(newGroup);
    } else if (!prevLatestMsg) {
      $scope.room.groupedMessages = $filter('groupBy')($scope.room.messages, 'created', function(msg) {
        return $filter('amChatGrouping')(msg.created);
      });
      // Open the latest group.
      $scope.room.groupedMessages[$scope.room.groupedMessages.length-1].open = true;
    } else {
      // Append to the latest group.
      $scope.room.groupedMessages[$scope.room.groupedMessages.length-1].items.push(args.msg);
    }
    prevLatestMsg = args.msg;

    // Scrolling to the bottom if sent by self.
    if (args.msg.ownerId !== $scope.currentUser.id) {
      // var scrollHandles = $filter('filter')(scrollHandle._instances, {$$delegateHandle: 'userMessageScroll'});
      // if (scrollHandles.length) {
      //   var msgScrollHandle = scrollHandles[0];
      // }
      var spoke = $scope.friends[args.msg.ownerId];
      $scope.notify = spoke.username+': '+$filter('brief')(args.msg);
      console.log('set notify');
    }

  });
  $scope.$on('urlViewLoaded', function(event, args) {
    console.log('urlViewLoaded');
    angular.forEach(args, function(val, id) {
      if (val) {
        var msg = $scope.room.messages[id];
        if (msg) {
          $NUChatDirectory.saveToDirectory(msg);
          // if (scrollHandle && msg.ownerId === $scope.currentUser.id) {
          //   scrollHandle.scrollBottom();
          //   console.log('scroll to bottom');
          // }
        }
      }
    });
    // console.log(RoomService.get());
    // console.log($stateParams.roomId);
    // console.log(data.roomId);
    // Saving the message into the Directory by type.
  });

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
  var scrollHandle = null;
  $timeout(function() {
    scrollHandle = $filter('filter')($ionicScrollDelegate._instances, {$$delegateHandle: 'userMessageScroll'})[0];//.$getByHandle('userMessageScroll');
    // Scrolling to the top of unread in initial.
    scrollHandle.scrollBottom();
    $scope.clearNotification();
    // console.log('scroll bottom');
  });

}	