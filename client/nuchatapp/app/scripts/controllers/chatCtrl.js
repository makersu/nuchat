function ChatCtrl($scope, $stateParams, User, Room, LBSocket, RoomService){
	console.log('ChatCtrl');
	console.log($stateParams.roomId)
  
	$scope.user = User.getCurrent();

	//$scope.room = Room.findById({ id: $stateParams.roomId });
  $scope.room = RoomService.get($stateParams.roomId)
	console.log($scope.room)



	//
  // Chat actions
  //
  $scope.joinRoom = function(id, switchRoom) {
  	console.log(id)
  	LBSocket.emit('room:join', id, function(room) {
  		console.log(room)

		});
	}	

	$scope.joinRoom($stateParams.roomId);










    //this.sendMessage = function(message) {
    //    self.socket.emit('room:messages:new', message);
    //}

    //$scope.messages=room.messages;

    $scope.sendMessage=function(sendMessageForm){
    	
    	//console.log($stateParams.roomId)
    	//scope.input.room=$stateParams.roomId
    	$scope.input.room=$scope.room
    	console.log($scope.input)

    	LBSocket.emit('room:messages:new', $scope.input);
    }
/*
    LBSocket.on('room:messages:new', function(message) {
    	console.log('room:messages:new='+message)
    	//$scope.room.messages.push(message)
      RoomService.addMessage(message)

			//self.addMessage(message);

    });
*/

}	