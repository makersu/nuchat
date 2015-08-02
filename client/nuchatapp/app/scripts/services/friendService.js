function FriendService(User, LBSocket, ENV, $q) {
	console.log('FriendService');

	var friends = {};

	//TODO: refactoring $q.defer()?
	//load frineds from pouchdb and get friends from server 
	// function getAllFriends() {
	// 	console.log('getAllFriends');

	// 	emitGetAllFriends();
		
	// 	return _.values(friends);//return array
	// }

	// //load friends from pouchdb
	// function loadAllFriends(){
	// 	console.log('loadAllFriends');
	// 	PouchService.getAllFriends().then(function(rows){
	// 		console.log(rows.length);
	// 		rows.forEach(function(row){
	// 			// console.log(row);
	// 			addFriend(row);
	// 		})
	// 	});
	// }

	//TODO: refactoring rename and PouchService?
	function emitGetAllFriends(){
		console.log('emitGetAllFriends');
		LBSocket.emit('friends:get', { userId: User.getCurrentId() }, function(err, friendObjs) {
			if (err) {
				console.log(err);
			}
			else {
				addFriends(friendObjs);
			}
		});
	}

	//add friends to friend list
	function addFriends(users){
		console.log('addFriends');
		console.log(users.length);
		users.forEach(function(user){
			addFriend(user);
		});
	}

	//add friend to friend list
	function addFriend(user){
		// console.log('addFriend');
		updateAvatar(user);
		// console.log(user);
		friends[user.id] = user;
	}

	//save friends to pouchdb
	function saveFriends(users){
		console.log('saveFriends');
		users.forEach(function(user){
			saveFriend(user);
		});
	}

	// //save friend to pouchdb
	// function saveFriend(user){
	// 	//TODO: addFriend failed if saveFriend failed
	// 	PouchService.saveFriend(user).then(function(doc){
	// 		console.log(doc);
	// 	},function(err){
	// 		console.log(err);
	// 	});//end PouchService.saveFriend
	// }

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
				console.log(newFriendObjs.length);
				addFriends(newFriendObjs);
				q.resolve( _.values(friends) );
			}
		});
		return q.promise;
	}

	//update avatar url
	function updateAvatar(user){
    if(user.avatarThumbnail){
    	if(user.avatarThumbnail.indexOf('http')==-1){
    		user.avatarThumbnail=ENV.GRIDFS_BASE_URL+user.avatarThumbnail;
    	}  
    }
    else{
			user.avatarThumbnail='images/profile.png';
    }
    // console.log(user.avatarThumbnail);
  }

	function getFriend(friendId) {
		console.log('getFriend');
		// console.log(friends);//
    return friends[friendId];
  }

  function removeAll(){
		console.log('removeAll');
		friends = {};
		console.log(friends);
  }

  function searchFriend(data){
		console.log('searchFriend');

		var deferred = $q.defer();
		LBSocket.emit('friends:find',data,function(err,results){
      if(err){
        console.log(err);
        deferred.reject(err);
      }
      else{
        console.log(results);
        deferred.resolve(results);
      }
    });

		return deferred.promise;
  }

  function getFriends(){
  	// console.log(friends);
  	return friends;
  }

  var service = {
  	emitGetAllFriends: emitGetAllFriends,
		getFriend: getFriend,
		addNewFriends: addNewFriends,
		removeAll: removeAll,
		searchFriend: searchFriend,
		getFriends: getFriends
  };

  return service;

}    