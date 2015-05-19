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

  $scope.createRoom = function() {
    console.log('createRoom');//

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
    RoomService.createRoom($scope.newRoom);
    $location.path('/tab/chats');
  };

  $scope.doRefresh = function() {
    console.log('doRefresh');//
    // $scope.availableRooms = RoomService.getAvailableRooms();
    // RoomService.getAvailableRooms().then(function(rooms){
    //   console.log('then');
    //   $scope.availableRooms=rooms;
    //   console.log($scope.availableRooms);//
    // });

    $scope.availableRooms = RoomService.getAllRooms();
    $scope.friends = FriendService.getAllFriends();
    
    //
    // angular.forEach($scope.availableRooms, function(room) {
    //   if (isPrivate(room)) {
    //     console.log('yes private');
    //     console.log(room);
    //     console.log(User.getCachedCurrent().id === room.ownerId ? room.friend : room.ownerId);
    //     console.log( FriendService.get(User.getCachedCurrent().id === room.ownerId ? room.friend : room.ownerId) );
    //     room.profile = FriendService.get(User.getCachedCurrent().id === room.ownerId ? room.friend : room.ownerId).avatarThumbnail;
    //   }
    // });
    //
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