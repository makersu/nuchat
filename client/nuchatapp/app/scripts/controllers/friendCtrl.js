function FriendCtrl($scope, FriendService, User, LBSocket){
	console.log('FriendCtrl');

  console.log('friends:get')
  LBSocket.emit('friends:get');

	$scope.friends = FriendService.getAll();

}