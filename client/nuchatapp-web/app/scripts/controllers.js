angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, $filter, Chats, User, $chatbox, RoomService, ENV, $checkFormat, $imageViewer, FriendService) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Custom message options
  var messageOptions = {
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
    // audioSetting: { 
    //   stop: { img: 'images/audiowave.png', icon: 'icon ion-play' }, 
    //   play: { img: 'images/audiowave.gif', icon: 'icon ion-pause' }
    // },
    remote: ENV.GRIDFS_BASE_URL,
  };

  function enterRoom(toChat, room) {
    $scope.chatboxes[toChat.username].show();
    RoomService.getRoomMessages(room.id);
  }
  
  $scope.chatboxes = {};
  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
  $scope.chatTo = function(accountId) {
    var privateroom = {
      user: User.getCachedCurrent().id,
      friend: accountId
    };

    var toChat = FriendService.getFriend(accountId)

    RoomService.createPrivateRoom(privateroom).then(function(room){
      console.log('RoomService.createPrivateRoom.then');
      console.log(room);

      if (room.id) {
        if (!$scope.chatboxes[chatId]) {
          $chatbox.fromTemplateUrl('templates/chat-detail.html', {
            scope: $scope,
            container: 'msgContainer',
            currentUser: User.getCachedCurrent(),
            roomName: toChat.username,
            roomObj: RoomService.getRoom(room.id),
            msgOptions: messageOptions,
          }).then(function(box) {
            $scope.chatboxes[toChat.username] = box;
            RoomService.setChattingRoom(room.id);
            enterRoom(toChat, room);
          });
        } else {
          if (!$scope.chatboxes[toChat.username].isShown())
            enterRoom(toChat, room);
        }
       
      }
    });

    console.log(User.getCachedCurrent());
  };

})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
