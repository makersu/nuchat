function ChatCtrl($scope, $rootScope, $state, $stateParams, $animate, User, LBSocket, RoomService, $localstorage, $q, $filter,
            $ionicScrollDelegate, $ionicTabsDelegate, $ionicNavBarDelegate, $gridMenu, $timeout, $NUChatObject, $NUChatDirectory, $NUChatLinks, $NUChatTags, METATYPE, ENV,
            $ionicModal, $location, $utils, FriendService, $imageViewer, $checkFormat) {

	console.log('ChatCtrl');
	console.log($stateParams.roomId);
  RoomService.getRoomMessages($stateParams.roomId)
  $scope.friends=FriendService.friends;

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
  // Scope Public
	$scope.currentUser = User.getCachedCurrent();
  // console.log($scope.currentUser)//
  $scope.input = {};
  $scope.messageOptions = {
    imgSetting: {
      clickHandler: function(id) {
        var imgList = [];
        angular.forEach($scope.room.groupedMessages, function(group) {
          var chunk = $filter('filter')(group.items, function(msg) {
            return $checkFormat.isImg(msg.type);
          });
          if (chunk.length) imgList = imgList.concat(chunk);
        });
        var selectedList = $filter('filter')(imgList, { id: id });
        var index = selectedList.length ? imgList.indexOf(selectedList[0]) : 0;
        $imageViewer.show(imgList, index, { imgSrcProp: 'originalFileId', base: ENV.GRIDFS_BASE_URL });
      }
    },
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
  var slideoutTabs = function() {
    var tabs = null;
    var tabHandles = $filter('filter')($ionicTabsDelegate._instances, { $$delegateHandle: 'chatDelegate' });
    if (tabHandles.length) {
      tabs = tabHandles[0].$tabsElement;
    }
    // console.log(tabs);
    if (tabs) {
      // Remove tabs.
      // console.log('remove tabs');
      $animate.addClass(tabs, 'slideout');
      // Shifting the message bubbles upward.
      $timeout(function() {
        var scrollContent = null;
        var scrollHandles = $filter('filter')($ionicScrollDelegate._instances, { $$delegateHandle: 'userMessageScroll' });
        if (scrollHandles.length) {
          // console.log(scrollHandles);
          angular.forEach(scrollHandles, function(handle) {
            handle.$element.removeClass('has-tabs-top');
          });
        }
        // Re-add the navbar back.
        $ionicNavBarDelegate.showBar(true);
      });
    }
  }
  // Scope Public
  // $scope.joinRoom = function(id, switchRoom) {
  //   console.log(id)
  //   LBSocket.emit('room:join', id, function(room) {
  //     console.log(room)
  //     //LBSocket.emit('room:messages:get', id);
  //   });
  // };
  $scope.sendMessage=function(isLocal){
    console.log('sendMessage');

    //console.log($stateParams.roomId)
    //scope.input.room=$stateParams.roomId
    $scope.input.roomId = $scope.room.id;
    $scope.input.ownerId = $scope.currentUser.id;
    console.log($scope.input);

    if (isLocal) {
      $scope.input.created = new Date();
      RoomService.addMessage($scope.input);
    } else {
      //LBSocket.emit('room:messages:new', $scope.input);
      RoomService.createMessage($scope.input);
    }
    RoomService.getLastGroup($scope.room).open = true;
    $timeout(function() {
      scrollHandle.scrollBottom();
    });

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
        // Sending message to local
        angular.forEach(results, function(imgUri) {
          $scope.input.text = imgUri;
          $scope.input.type = METATYPE.IMG;
          $scope.sendMessage(true);
        });
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
      // Sending message to local
      $scope.input.text = imgUri;
      $scope.input.type = METATYPE.IMG;
      $scope.sendMessage(true);
      if ($scope.metaMenu.isShown()) {
        $scope.closeMetaMenu();
      }
    }, errorHandler);
  };
  $scope.captureVoice = function() {
    $NUChatObject.captureAudioUpload(function(audioUri) {
      // Sending message to local
      $scope.input.text = audioUri;
      $scope.input.type = METATYPE.AUDIO;
      $scope.sendMessage(true);
      if ($scope.metaMenu.isShown()) {
        $scope.closeMetaMenu();
      }
    }, errorHandler);
  };
  $scope.captureVideo = function() {
    $NUChatObject.captureVideoUpload(function(videoUri) {
      // Sending message to local
      $scope.input.text = videoUri;
      $scope.input.type = METATYPE.VIDEO;
      $scope.sendMessage(true);
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
    var lastGroup = RoomService.getLastGroup($scope.room);
    if ( lastGroup && lastGroup.open && scrollHandle.getScrollPosition().top >= (bound/2) ) {
      $scope.clearNotification();
    }
  };

  /* Inline Notification */
  $scope.clearNotification = function() {
    !$scope.$$phase && $scope.$apply(function() {
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

  // OnResume
  $scope.$on('$ionicView.enter', function() {
    console.log('enter controller');
    console.log($scope.room);//
    // Initializing NUChatObject service
    $NUChatObject.init($scope.room, $scope.currentUser);

    // Reset the NUChatLinks
    $NUChatLinks.reset();

    slideoutTabs();
  });

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

    // Sending the local notification if got the message by someone.
    if (args.msg.ownerId !== $scope.currentUser.id) {
      // var scrollHandles = $filter('filter')(scrollHandle._instances, {$$delegateHandle: 'userMessageScroll'});
      // if (scrollHandles.length) {
      //   var msgScrollHandle = scrollHandles[0];
      // }
      var spoke = $scope.friends[args.msg.ownerId];
      if (spoke) {
        $scope.notify = spoke.username+': '+$filter('brief')(args.msg);
        console.log('set notify');
      } else {
        console.error('Cannot find the user('+args.msg.ownerId+') from the friend list');
      }
    }

    if (args.msg.type !== METATYPE.LINK) {
      $NUChatDirectory.saveToDirectory(args.msg);
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
    // scroller.style.bottom = newFooterHeight + 'px'; 
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