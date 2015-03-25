function RoomCtrl($scope, $state, $location, RoomService){
	console.log('RoomCtrl');//

  $scope.availableRooms = RoomService.getAvailableRooms();
  console.log($scope.availableRooms);

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
    $scope.$broadcast('scroll.refreshComplete');
    $scope.$apply();
  };

  $scope.goToRoom = function(roomId) {
    $state.go('tab.chatRoom', { roomId: roomId }, { reload: true });
  };

}