function ChatCtrl($scope, $rootScope, $document, $state, $stateParams, $animate, User, LBSocket, RoomService, $localstorage, $q, $filter,
            $ionicScrollDelegate, $ionicTabsDelegate, $ionicGesture, $ionicModal, $gridMenu, $sidePanel, $timeout, $NUChatObject, $NUChatDirectory, $NUChatLinks, $NUChatTags, METATYPE, ENV,
            $location, $utils, FriendService, $imageViewer, $checkFormat, $compile) {

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
  var unreadInit = false;
  
  $scope.msgAdapter = {};
  // Scope Public
  $scope.roomModalTitle = $filter('translate')('MANAGE_ROOM');
	$scope.currentUser = User.getCachedCurrent();
  $scope.currentUser.avatarThumbnail = ENV.GRIDFS_BASE_URL+$scope.currentUser.avatarThumbnail;
  $scope.joinerList = [];
  // console.log($scope.currentUser)//
  $scope.input = {};
  $scope.messageOptions = {
    imgSetting: {
      clickHandler: function(id) {
        var imgList = [];
        angular.forEach($scope.room.viewMessages, function(msg) {
          $checkFormat.isImg(msg.type) && imgList.push(msg);
        });
        var selectedList = $filter('filter')(imgList, { id: id });
        if (!selectedList.length) {
          selectedList = $filter('filter')(imgList, { timestamp: id });
        }
        var index = selectedList.length ? imgList.indexOf(selectedList[0]) : 0;
        imgList = $filter('orderBy')(imgList, 'created');
        $imageViewer.show(imgList, index, { imgSrcProp: 'originalFileId', base: ENV.GRIDFS_BASE_URL });
      }
    },
    audioSetting: { 
      stop: { img: 'images/audiowave.png', icon: 'icon ion-play' }, 
      play: { img: 'images/audiowave.gif', icon: 'icon ion-pause' }
    },
    linkSetting: {
      clickHandler: $rootScope.openInappbrowser,
    },
    remote: ENV.GRIDFS_BASE_URL,
  };
  // Filters
  $scope.members = {open: true};
  // Calendar
  $scope.dateFilter = {};
  // console.log($scope.currentUser);

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
      });
    }
  }
  /* Getting the all the users joined this room except the currentUser
   */
  function getRoomUsers() {
    console.log('getRoomUsers');
    $scope.joinerList = [];
    // console.log($scope.room);//
    angular.forEach($scope.room.joiners, function(joiner) {
      $scope.friends[joiner] && $scope.joinerList.push($scope.friends[joiner]) && ($scope.friends[joiner].selected = true);
    });
    ($scope.isGroupOwner = RoomService.isGroup($scope.room) && $scope.currentUser.id === $scope.room.ownerId) && ($scope.friendList = _.values($scope.friends));
  }

  /* Appending the message to ui-scroll list
   */
  function appendMessage(message) {
    if (!unreadInit) {
      unreadInit = true;
      $scope.datasource._revision++;
      // Scrolling to the start of unread messages.
      $location.hash('unreadStart');
      scrollHandle.anchorScroll();
      console.log('scrolling to unreadStart');
    }
    $scope.msgAdapter.applyUpdates(function(item, scope) {
      console.log($scope.room.viewMessages.length);
      console.log(scope.$index+RoomService.getUnreadMessagePosition($scope.room.id));
      if ( scope.$index+RoomService.getUnreadMessagePosition($scope.room.id) === $scope.room.viewMessages.length-1 ) {
        return [item, message];
      }
    });
    // RoomService.groupMessagesByDate($scope.room);
  }

  /* Insert Unread Note into message bubbles
   */
  function insertUnreadNote() {
    var msgContainer = document.getElementById('msgContainer');
    // Insert the unread note
    var note = document.getElementById('unreadStart');
    if (!note) {
      note = angular.element($compile('<unread-note id="unreadStart"></unread-note>')($scope))[0];
    }
    var lastReadMessageId = RoomService.getLastReadMessageId();
    if (lastReadMessageId && lastReadMessageId !== $scope.room.viewMessages[$scope.room.viewMessages.length-1].id
      && $scope.room.messages[lastReadMessageId].ownerId !== $scope.currentUser.id) {
      var lastReadMsgEl = document.getElementById('item-'+lastReadMessageId);
      var parentEl = angular.element(lastReadMsgEl).parent()[0];
      parentEl && parentEl.insertBefore(note, lastReadMsgEl.nextSibling);
    } else if (!lastReadMessageId && $scope.room.viewMessages.length) {
      angular.element(msgContainer).find('div').eq(0).prepend(note);
    }
  }

  // Scope Public
  $scope.sendMessage=function(isLocal){
    console.log('sendMessage');

    //console.log($stateParams.roomId)
    //scope.input.room=$stateParams.roomId
    // console.log($scope.room);
    $checkFormat.isLink($scope.input) && ($scope.input.type = METATYPE.LINK);
    $scope.input.roomId = $scope.room.id;
    $scope.input.ownerId = $scope.currentUser.id;
    // console.log($scope.input);

    if (isLocal) {
      $scope.input.created = new Date().toISOString();
      RoomService.addMessage($scope.input);
    } else {
      //LBSocket.emit('room:messages:new', $scope.input);
      RoomService.emitCreateMessage($scope.input);
    }

    $scope.input = {};

    if ($scope.metaMenu.isShown()) {
      $scope.closeMetaMenu();
    }

    // Scrolling down to see the sent message.
    $timeout(function() {
      scrollHandle.scrollBottom();
      $scope.notify = false;
    }, 500);
  };
  $scope.gotoDirectory = function() {
    // $scope.closeRightMenu();
    console.log($scope.room.messages);
    if ($scope.rightMenu.isShown()) $scope.closeFilterPanel();
    $state.go('tab.directory.article', { roomId: $scope.room.id });
  };

  // Grouping
  // $scope.collapseGroup = function(group) {
  //   group.open = false;
  //   $location.hash(group.name);
  //   scrollHandle.anchorScroll();
  // };

  /* Grid Menu */
  if (!$scope.metaMenu) {
    $gridMenu.fromTemplateUrl('metamenu.html', {
      scope: $scope,
      hasHeader: true
    }).then(function(menu) {
      $scope.metaMenu = menu;
    });
  }
  $scope.openMetaMenu = function() {
    $scope.metaMenu.show();
  };
  $scope.closeMetaMenu = function() {
    $scope.metaMenu.hide();
  };
  // Room Menu
  $scope.openRoomMenu = function() {
    if (!$scope.roomMenu) {
      $gridMenu.fromTemplateUrl('roommenu.html', {
        scope: $scope,
        hasHeader: true
      }).then(function(menu) {
        $scope.roomMenu = menu;
        $scope.roomMenu.show();
      });
    } else {
      $scope.roomMenu.show();
    }
  };

  $scope.upsertGroupRoom = function() {
    console.log('updateGroupRoom');//
    console.log($scope.theRoom);

    var updateRoom={}
    updateRoom.id=$scope.theRoom.id
    updateRoom.name=$scope.theRoom.name
    updateRoom.description=$scope.theRoom.description
    updateRoom.joiners=[]
    updateRoom.joiners.push(User.getCachedCurrent().id)

    $scope.friendList.forEach(function(friend){
      if(friend.selected){
        // console.log(friend);
          updateRoom.joiners.push(friend.id);
      }
    });

    console.log(updateRoom);
    RoomService.updateGroupRoom(updateRoom);

    // $location.path('/tab/chats');
    $scope.roomModal.hide();
  };

  $scope.closeRoomMenu = function() {
    $scope.roomMenu.hide();
  };
  // Room Modal
  $scope.openRoomModalEdit = function() {
    if (!$scope.roomModal) {
      $ionicModal.fromTemplateUrl('templates/modals/modalCreateEditRoom.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.roomModal = modal;
        $scope.roomModal.show();
      });
    } else {
      $scope.roomModal.show();
    }
    $scope.roomMenu.hide();
  };
  $scope.closeRoomModal = function() {
    $scope.roomModal.hide();
  };
  /* Side Menu */
  if (!$scope.rightMenu) {
    $sidePanel.fromTemplateUrl('rightMenu.html', {
      scope: $scope,
      container: document.getElementById('userMessagesView'),
    }).then(function(menu) {
      $scope.rightMenu = menu;
    });
  }
  $scope.openFilterPanel = function() {
    console.log('openFilterPanel');
    $scope.roomMenu.hide();
    $scope.rightMenu.show();
  };
  $scope.closeFilterPanel = function() {
    $scope.rightMenu.hide();
  };
  /* Choose files from device or cloud drive? */
  $scope.choosePhoto = function() {
    $NUChatObject.choosePhotosUpload(
      function(results) {
        // Sending message to local
        angular.forEach(results, function(msg) {
          console.log(msg);
          $scope.input = msg;
          // $scope.input.type = METATYPE.IMG;
          $scope.sendMessage(true);
        });
        if ($scope.metaMenu.isShown()) {
          $scope.closeMetaMenu();
        }
      }, errorHandler, {
        width: 640
      }
    );
  };
  $scope.capturePhoto = function() {
    $NUChatObject.capturePhotoUpload(function(msg) {
      console.log(msg);
      // Sending message to local
      $scope.input = msg;
      // $scope.input.type = METATYPE.IMG;
      $scope.sendMessage(true);
      if ($scope.metaMenu.isShown()) {
        $scope.closeMetaMenu();
      }
    }, errorHandler);
  };
  $scope.captureVoice = function() {
    $NUChatObject.captureAudioUpload(function(msg) {
      // Sending message to local
      $scope.input = msg;
      // $scope.input.type = METATYPE.AUDIO;
      $scope.sendMessage(true);
      if ($scope.metaMenu.isShown()) {
        $scope.closeMetaMenu();
      }
    }, errorHandler);
  };
  $scope.captureVideo = function() {
    $NUChatObject.captureVideoUpload(function(msg) {
      // Sending message to local
      $scope.input = msg;
      // $scope.input.type = METATYPE.VIDEO;
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
  $scope.star = $NUChatTags.setFavorite;
  $scope.isFavorite = function(msg) {
    return $NUChatTags.isFavorite(msg) ? 'ion-ios-star' : 'ion-ios-star-outline';
  };
  $scope.like = $NUChatTags.setLike;
  $scope.isLike = $NUChatTags.isLike;
  $scope.share = function(msg) {
    var shareStr = null;
    if ( $checkFormat.isImg(msg.type) ) {
      shareStr = ENV.GRIDFS_BASE_URL + msg.originalFileId;
      window.plugins.socialsharing.share(null, null, shareStr);
    // } else if ( $checkFormat.isAudio(msg.type) || $checkFormat.isVideo(msg.type) ) {
    //   shareStr = ENV.GRIDFS_BASE_URL + msg.originalFileId;
    //   window.plugins.socialsharing.share(shareStr);
    } else {
      shareStr = msg.text;
      window.plugins.socialsharing.share(shareStr);
    }
  };

  /* Filtering */
  $scope.filterByUser = function(user) {
    // angular.forEach($scope.room.groupedMessages, function(group) {
    // console.log(user.id);
    RoomService.filterByUser($scope.room, user.id);
    // $scope.room.viewMessages = $filter('filter')(_.values($scope.room.messages), { ownerId: user.id });
    // $scope.datasource.cache.clear();
    $scope.datasource._revision++;
    $scope.closeFilterPanel();
    //   console.log(group.items);
    // });
  };
  $scope.filterByDate = function() {
    var date = $filter('amChatGrouping')($scope.dateFilter.date);
    RoomService.filterByDate($scope.room, date);

    // $scope.datasource.cache.clear();
    $scope.datasource._revision++;
    $scope.closeFilterPanel();
  };
  $scope.filterByTags = function() {
    // console.log('filterByTags');
    $NUChatTags.filterList();
    $scope.room.viewMessages = $NUChatTags.getFilteredList();
    // $scope.datasource.cache.clear();
    $scope.datasource._revision++;
  }
  $scope.getAllMessages = function() {
    // console.log('getAllMessages');
    RoomService.getAllMessages($scope.room);
    // $scope.room.viewMessages = _.values($scope.room.messages);
    // $scope.datasource.cache.clear();
    $scope.datasource._revision--;
    $scope.closeFilterPanel();
  };

  /* Trigger functions */
  $scope.viewCalendar = function(callback) {
    $scope.selectTime = true;
  };
  // Define the function on date changed.
  $scope.setDate = function(d) {
    $scope.selectTime = false;
    callback(d);
  };

  /* Events */
  $scope.checkScroll = function() {
    var bound = scrollHandle.element.scrollHeight;
    // console.log('bound: '+bound);
    // console.log('scroll bottom: '+(scrollHandle.getScrollPosition().top));
    if ( scrollHandle.getScrollPosition().top+scrollHandle.element.offsetHeight >= (bound*.935) ) {
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
  // console.log('ChatCtrl');
  // console.log($stateParams.roomId);
  RoomService.setCurrentRoom($stateParams.roomId);
  $scope.theRoom = $scope.room = RoomService.getCurrentRoom();
  var datasource = {
    _revision: 0,
    get: function(index, count, success) {
      var delay = 10;
      $timeout(function() {
        // console.log(index);
        index--;
        if ($scope.room.viewMessages) {
          var unreadPosition = RoomService.getUnreadMessagePosition($scope.room.id);
          // console.log('unreadPosition: '+unreadPosition);
          var start, end;
          var actualIndex = index + unreadPosition;
          start = Math.max(0 - unreadPosition, actualIndex);
          if (actualIndex === $scope.room.viewMessages.length-1) {
            start = Math.max(start, $scope.room.viewMessages.length-count);
          }
          end = Math.min(actualIndex + count-1, $scope.room.viewMessages.length);
          // if (index < 0) {
          //   count = count + index;
          //   index = 0;
          //   if (count <= 0) {
          //     success([]);
          //     return;
          //   }
          // }
          if (start > end) {
            success([]);
          } else {
            if (start < 0) {
              count = count + start;
              start = 0;
              if (count <= 0) {
                success([]);
                return;
              }
            }
            success($scope.room.viewMessages.slice(start, end+1));
            insertUnreadNote();
          }
        }
      }, delay);
    },
    revision: function() {
      return datasource._revision;
    }
  };
  $scope.datasource = datasource;
  // $scope.datasource.cache.initialize();
  console.log($scope.room);
  RoomService.getRoomMessages($scope.room.id);

  // OnResume
  $scope.$on('$ionicView.enter', function() {
    console.log('enter controller');
    // console.log($scope.room);//
    $scope.friends = FriendService.getFriends();
    // Getting the other users joined the room.
    getRoomUsers();
    $scope.room = RoomService.getCurrentRoom();
    RoomService.groupMessagesByDate($scope.room);
    $scope.datasource._revision++;

    RoomService.getRoomTags($scope.room.id);
    // $scope.room.groupedMessages = $filter('groupBy')($scope.room.messages, 'created', function(msg) {
    //   return $filter('amChatGrouping')(msg.created);
    // });
    console.log($scope.room);
    // Initializing NUChatObject service
    $NUChatObject.init($scope.room, $scope.currentUser);

    // Reset the NUChatLinks
    $NUChatLinks.reset();

    slideoutTabs();

  });

  // OnPause
  $scope.$on('$ionicView.leave', function(e) {

  });

  $scope.$on('$destroy', function() {
    $scope.metaMenu.remove();
    $scope.rightMenu.remove();
  });

  $scope.$on('onResume', function() {
    console.log('onResume');
    $scope.friends = FriendService.getFriends();
    // Getting the other users joined the room.
    getRoomUsers();
    RoomService.getRoomMessages($scope.room.id);
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

  // Register event listeners
  $scope.$on('onNewMessage', function(event, args) {

    // Sending the local notification if got the message by someone.
    if (args.msg.ownerId !== $scope.currentUser.id) {
      var spoke = $scope.friends[args.msg.ownerId];
      if (spoke) {
        $scope.notify = spoke.username+': '+$filter('brief')(args.msg);
      } else {
        console.error('Cannot find the user('+args.msg.ownerId+') from the friend list');
      }
    } else {  // If sent by self, opening the group.
      $scope.notify = false;
    }

    appendMessage(args.msg);

    // if (args.msg.type !== METATYPE.LINK) {
    //   $NUChatDirectory.saveToDirectory(args.msg);
    // }

  });

  $scope.$on('updateObjMsg', function(event, args) {
    console.log('on updateObjMsg');
    delete $scope.room.messages[args.msg.timestamp];
    $scope.room.messages[args.msg.id] = args.msg;
    console.log($scope.room);
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