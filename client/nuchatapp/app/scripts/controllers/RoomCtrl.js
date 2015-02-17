function RoomCtrl($scope, $location, User, LBSocket, RoomService){
	console.log('RoomCtrl');//

  $scope.availableRooms = RoomService.getAll();
  console.log($scope.availableRooms);//

  $scope.newRoom={};

	$scope.goToCreateRoom = function () {
    console.log('goToCreateRoom')
    $location.path('/tab/createRoom');
  };
 
  $scope.createRoom = function() {
    console.log('createRoom');//
    $scope.newRoom.type='group'
    LBSocket.emit('rooms:create', $scope.newRoom)
    $location.path('/tab/chats')
  };

   $scope.doRefresh = function() {
    console.log('doRefresh');//
    console.log('rooms:get');//
    LBSocket.emit('rooms:get',User.getCachedCurrent());//callback once getall?
    $scope.$broadcast('scroll.refreshComplete');
    $scope.$apply()
  };

  //TODO: refactoring move?
  console.log('rooms:get');
  LBSocket.emit('rooms:get',User.getCachedCurrent());//callback once getall?

}