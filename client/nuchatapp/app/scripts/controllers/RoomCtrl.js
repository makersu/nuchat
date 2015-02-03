function RoomCtrl($scope, $location, Room, LBSocket, RoomService){
	console.log('RoomCtrl');

	$scope.goToCreateRoom = function () {
    console.log('goToCreateRoom')
    $location.path('/tab/createRoom');
  };

  $scope.availableRooms = RoomService.getAll();
  console.log($scope.availableRooms)

  console.log('rooms:get')
	LBSocket.emit('rooms:get');

/*
	LBSocket.on('rooms:new', function(room) {
    console.log('rooms:new')
		console.log(angular.toJson(room))
    //$scope.availableRooms.push(room);//todo
    RoomService.addRoom(room);
  });
*/


  $scope.newRoom={}

  $scope.createRoom = function() {
  	console.log('createRoom')

  	//console.log($scope.newRoom)
		
		LBSocket.emit('rooms:create', $scope.newRoom)

  	$location.path('/tab/chats')
  }

}	