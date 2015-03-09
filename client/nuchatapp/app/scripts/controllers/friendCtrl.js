function FriendCtrl($scope, $state, $ionicHistory, $location, User, LBSocket, FriendService, RoomService){
	console.log('FriendCtrl');

	$scope.friends = FriendService.getAll();

	$scope.friendChat = function(friendId){
		console.log(friendId);//

		var privateroom={
  		user:User.getCachedCurrent().id,
  		friend:friendId
  	}

  	LBSocket.emit('friend:join', privateroom, function(room) {
      console.log('friend:join callback')
  		console.log(room)
      if(room.id){
        console.log($ionicHistory.backView())
        console.log($ionicHistory.currentView())
      	//$ionicHistory.currentView($ionicHistory.backView());
      	$state.go('tab.chatRoom',{roomId:room.id},{location: 'replace'});	
        // $location.path('/tab/room/'+room.id);
      }
		});

	}

  $scope.doRefresh = function() {
    console.log('doRefresh')
    console.log('friends:get');
    LBSocket.emit('friends:get');//callback once getall?
    $scope.$broadcast('scroll.refreshComplete');
    $scope.$apply()
  };

  //TODO: refactoring move?
  console.log('friends:get');//
  LBSocket.emit('friends:get');

}