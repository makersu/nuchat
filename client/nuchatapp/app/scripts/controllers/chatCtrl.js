function ChatCtrl($scope, $stateParams, User, Room, LBSocket, RoomService){
	console.log('ChatCtrl');
	console.log($stateParams.roomId)
  
	$scope.currentUser = User.getCurrent();
  console.log($scope.currentUser)

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
      //LBSocket.emit('room:messages:get', id);


		});
	}	

	$scope.joinRoom($stateParams.roomId);










    //this.sendMessage = function(message) {
    //    self.socket.emit('room:messages:new', message);
    //}

    //$scope.messages=room.messages;

    $scope.sendMessage=function(sendMessageForm){
      console.log('sendMessage')
    	
    	//console.log($stateParams.roomId)
    	//scope.input.room=$stateParams.roomId
    	$scope.input.room=$scope.room
      $scope.input.owner = $scope.currentUser.id;
    	console.log($scope.input)

    	LBSocket.emit('room:messages:new', $scope.input);
      $scope.input={}
    }
/*
    LBSocket.on('room:messages:new', function(message) {
    	console.log('room:messages:new='+message)
    	//$scope.room.messages.push(message)
      RoomService.addMessage(message)

			//self.addMessage(message);

    });
*/
  var footerBar = document.body.querySelector('#userMessagesView .bar-footer');
  var scroller = document.body.querySelector('#userMessagesView .scroll-content');
  // I emit this event from the monospaced.elastic directive, read line 480
    $scope.$on('taResize', function(e, ta) {
      console.log('taResize');
      if (!ta) return;
      
      var taHeight = ta[0].offsetHeight;
      console.log('taHeight: ' + taHeight);
      
      if (!footerBar) return;
      
      var newFooterHeight = taHeight + 10;
      newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;
      
      footerBar.style.height = newFooterHeight + 'px';
      scroller.style.bottom = newFooterHeight + 'px'; 
    });

}	