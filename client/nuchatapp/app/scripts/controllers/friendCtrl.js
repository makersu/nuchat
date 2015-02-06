function FriendCtrl($scope, $friend, User, LBSocket){
	console.log('FriendCtrl');

  console.log('friends:get')
  LBSocket.emit('friends:get');

	$scope.friends = $friend.getAll();

}