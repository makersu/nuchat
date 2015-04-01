function FriendService(User, LBSocket, ENV) {
	console.log('FriendService');

	var friends = {};
	console.log(friends)

	LBSocket.on('friends:new', function(friend) {
		console.log('friends:new');//
		console.log(friend);//
		console.log(User.getCachedCurrent());//
		if( friend.id != User.getCachedCurrent().id){
			console.log('addFriend');
			updateAvatar(friend)
			friends[friend.id]=friend;
		}
	});

	//
	function getFriends(){
		console.log('getFriends');
		console.log('friends:get');

  	LBSocket.emit('friends:get',{userId:User.getCachedCurrent().id},function(err,oldFriends){
  		if(err){
  			console.log(err)
  		}
  		else{
  			addFriends(oldFriends)
  		}
  	});
	}

	//
	function addNewFriends(data){
		console.log('addFriend');
		console.log('friends:new');
  	LBSocket.emit('friends:new',data,function(err,newFriends){
  		if(err){
  			console.log(err)
  		}
  		else{
  			addFriends(newFriends)
  		}
  	});
	}

	function addFriends(users){
		console.log(users)
		for(var i=0;i<users.length;i++){
			console.log(users[i])
			updateAvatar(users[i])
			friends[users[i].id]=users[i]
		}
		console.log(friends)
	}

	function updateAvatar(friend){
    if(friend.avatarThumbnail){
      friend.avatarThumbnail=ENV.GRIDFS_BASE_URL+friend.avatarThumbnail
    }
    else{
    	friend.avatarThumbnail='images/profile.png'
    }
    console.log(friend.avatarThumbnail)
  }

	function get(friendId) {
    return friends[friendId];
  }

  getFriends();

  var service = {
		friends: friends,
		get: get,
		getFriends: getFriends,
		addNewFriends: addNewFriends
  };

  return service;

}    