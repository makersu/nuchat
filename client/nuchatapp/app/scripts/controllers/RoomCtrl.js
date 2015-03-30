function RoomCtrl($scope, $state, $location, RoomService, $timeout, User, $filter, FriendService){
	console.log('RoomCtrl');//

  /* Methods */
  function isPrivate(room) {
    console.log(room.type);
    return room.type === 'private';
  }

	$scope.goToCreateRoom = function () {
    console.log('goToCreateRoom');
    $location.path('/tab/createRoom');
  };
 
  $scope.newRoom={};
  $scope.createRoom = function() {
    console.log('createRoom');//
    $scope.newRoom.type='group';
    RoomService.createRoom($scope.newRoom);
    $location.path('/tab/chats');
  };

   $scope.doRefresh = function() {
    console.log('doRefresh');//
    $scope.availableRooms = RoomService.getAvailableRooms();
    //
    angular.forEach($scope.availableRooms, function(room) {
      if (isPrivate(room)) {
        console.log( FriendService.get(User.getCachedCurrent().id === room.ownerId ? room.friend : room.ownerId) );
        room.profile = FriendService.get(User.getCachedCurrent().id === room.ownerId ? room.friend : room.ownerId).avatarThumbnail;
      }
    });
    //
    $scope.$broadcast('scroll.refreshComplete');
    $scope.$apply();
  };

  $scope.goToRoom = function(roomId) {
    $state.go('tab.chatRoom', { roomId: roomId }, { reload: true });
  };

  /* Onload */
  $timeout(function() {
    // $scope.availableRooms = RoomService.getAvailableRooms();
    // console.log($scope.availableRooms);
    $scope.doRefresh();
  });
  
}