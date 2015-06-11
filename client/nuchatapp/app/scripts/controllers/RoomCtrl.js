function RoomCtrl($scope, $state, $location, RoomService, $timeout, User, $filter, FriendService, $ionicTabsDelegate, $animate, $ionicModal){
	console.log('RoomCtrl');//
  /* Variables */
  // Scope Public
  $scope.theRoom = {};
  $scope.roomModalTitle = $filter('translate')('CREATE_ROOM');

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
	$scope.openCreateRoom = function () {
    console.log('goToCreateRoom');
    if (!$scope.roomModal) {
      $ionicModal.fromTemplateUrl('templates/modals/modalCreateEditRoom.html', {
        scope: $scope,
      }).then(function(modal) {
        $scope.roomModal = modal;
        $scope.roomModal.show();
      });
    } else {
      $scope.roomModal.show();
    }
    // $location.path('/tab/createRoom');
  };

  $scope.updateGroupRoom = function() {
    console.log('createGroupRoom');//

    $scope.theRoom.user=User.getCachedCurrent().id;
    $scope.theRoom.type='group';
    $scope.theRoom.joiners=[];
    $scope.theRoom.joiners.push(User.getCachedCurrent().id)

    $scope.friendList.forEach(function(friend){
      if(friend.selected){
        console.log(friend);
        $scope.theRoom.joiners.push(friend.id);
      }
    });

    console.log($scope.theRoom);
    RoomService.createGroupRoom($scope.theRoom);
    // $location.path('/tab/chats');
    $scope.roomModal.hide();
  };

  $scope.closeRoomModal = function() {
    $scope.roomModal.hide();
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

    $scope.friendList = _.values(FriendService.friends);
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