function RoomCtrl($scope, $state, $location, RoomService, $timeout, User, $filter, FriendService, $ionicTabsDelegate, $animate){
	console.log('RoomCtrl');//

  /* Methods */
  // Private
  function isPrivate(room) {
    console.log(room.type);
    return room.type === 'private';
  }

  function slideinTabs() {
    var tabs = null;
    var tabHandles = $filter('filter')($ionicTabsDelegate._instances, { $$delegateHandle: 'chatDelegate' });
    if (tabHandles.length) {
      tabs = tabHandles[0].$tabsElement;
      if (tabs) {
        // Re-add tabs.
        $animate.removeClass(tabs, 'slideout');
      }
    }
  }

  // Scope Public
	$scope.goToCreateRoom = function () {
    console.log('goToCreateRoom');
    $location.path('/tab/createRoom');
  };
 
  $scope.newRoom={};

  $scope.createGroupRoom = function() {
    console.log('createGroupRoom');//

    $scope.newRoom.user=User.getCachedCurrent().id;
    $scope.newRoom.type='group';
    $scope.newRoom.joiners=[];
    $scope.newRoom.joiners.push(User.getCachedCurrent().id)

    $scope.friends.forEach(function(friend){
      if(friend.selected){
        console.log(friend);
        $scope.newRoom.joiners.push(friend.id);
      }
    })

    console.log($scope.newRoom);
    RoomService.createGroupRoom($scope.newRoom);
    $location.path('/tab/chats');
  };

  $scope.doRefresh = function() {
    console.log('doRefresh');//
    
    // $scope.availableRooms = RoomService.getAllRooms();
    $scope.availableRooms = RoomService.rooms;

    var unWatchAvailableRooms = $scope.$watch('availableRooms', function(newVal) {
      if (newVal) {
        $scope.availableRoomList = _.values(newVal);
      }
    }, true);
    // $scope.friends = FriendService.getAllFriends();
    $scope.friends = _.values(FriendService.friends);

    $scope.$broadcast('scroll.refreshComplete');
    $scope.$apply();
  };

  $scope.goToRoom = function(roomId) {
    $state.go('tab.chatRoom', { roomId: roomId }, { reload: true });
  };

  /* Onload */
  $scope.$on('$ionicView.enter', function() {
    // $scope.availableRooms = RoomService.getAvailableRooms();
    // console.log($scope.availableRooms);
    slideinTabs();
    $scope.doRefresh();
  });
  
}