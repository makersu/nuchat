function FriendService(User, LBSocket, ENV) {
	console.log('FriendService');

	var currentUser = User.getCachedCurrent();

	var friends = {};

	LBSocket.on('friends:new', function(friend) {
		console.log('friends:new');//
		console.log(friend);//
		console.log(currentUser);//
		if( friend.id != currentUser.id){
			console.log('addFriend');
			updateAvatar(friend)
			friends[friend.id]=friend;
		}
	});

	function updateAvatar(friend){
    if(friend.avatarThumbnail){
      friend.avatarThumbnail=ENV.GRIDFS_BASE_URL+friend.avatarThumbnail
    }
    else{
    	friend.avatarThumbnail='images/profile.png'
    }
    console.log(friend.avatarThumbnail)
  }

	function getAll(){
		return friends;
	}

	function get(friendId) {
    return friends[friendId];
  }

  //TODO: refactoring extract and move?
  console.log('friends:get');//
  LBSocket.emit('friends:get');

  var service = {
		getAll: getAll,
		get: get
  };

  return service;

}    