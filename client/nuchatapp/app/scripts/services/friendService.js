function FriendService(User, LBSocket, ENV, $q, PouchService) {
	console.log('FriendService');

	var friends = {};

	//TODO: refactoring $q.defer()?
	//load frineds from pouchdb and get friends from server 
	function getAllFriends() {
		console.log('getAllFriends');

		//loadFriends();
		emitGetFriends();
		
		console.log(friends);//
		return _.values(friends);
	}

	//load friends from pouchdb
	function loadFriends(){
		console.log('loadFriends');
		PouchService.getFriends().then(function(rows){
			console.log(rows);
			rows.forEach(function(row){
				// console.log(row);
				addFriend(row.key);
			})
		});
	}

	//TODO: refactoring rename and PouchService?
	function emitGetFriends(){
		console.log('emitGetFriends');
		LBSocket.emit('friends:get', { user: User.getCachedCurrent().id }, function(err,friendObjs) {
			if (err) {
				console.log(err);
			}
			else {
				console.log(friendObjs);
				friendObjs.forEach(function(friendObj){
					addFriend(friendObj);
					//TODO: addFriend failed if saveFriend failed
					PouchService.saveFriend(friendObj).then(function(doc){
						// console.log(doc);
						// addFriend(doc);
					},function(err){
						console.log(err);
					});//end PouchService.saveFriend
				});
			}
		});
	}

	//add friend to friend list
	function addFriend(user){
		console.log('addFriend');
		console.log(user);
		updateAvatar(user);
		friends[user.id] = user;
	}

	//TODO: refactoring pouchdb and emit name?
	//add new friends to friend list
	function addNewFriends(data) {
		console.log('addNewFriends');
		var q = $q.defer();
		console.log('emit friends:new');//?
		LBSocket.emit('friends:new', data, function(err, newFriendObjs) {
			if(err) {
				console.error(err);
			}
			else {
				newFriendObjs.forEach(function(newFriendObj){
					console.log(newFriendObj);
					addFriend(newFriendObj);
				});
				q.resolve( _.values(friends) );
			}
		});
		return q.promise;
	}

	//update avatar url
	function updateAvatar(friend){
    if(friend.avatarThumbnail){
      friend.avatarThumbnail=ENV.GRIDFS_BASE_URL+friend.avatarThumbnail;
    }
    else{
			friend.avatarThumbnail='images/profile.png';
    }
    console.log(friend.avatarThumbnail);
  }

	function getFriend(friendId) {
    return friends[friendId];
  }

  function removeAll(){
		friends = {};
  }

  // getFriends();

  var service = {
  	friends: friends,
		getAllFriends: getAllFriends,
		getFriend: getFriend,
		addNewFriends: addNewFriends,
		removeAll: removeAll
  };

  return service;

}    