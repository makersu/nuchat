function FriendService(LBSocket, User) {
	console.log('FriendService')

	// Some fake testing data
  //var friends = [
  //  { id: 0, username: 'Scruff McGruff' },
  //  { id: 1, username: 'G.I. Joe' },
  //  { id: 2, username: 'Miss Frizzle' },
  //  { id: 3, username: 'Ash Ketchum' }
  //];

  var currentUser = User.getCurrent();

  var friends = {}

	LBSocket.on('friends:new', function(friend) {
    console.log('friends:new')
		console.log(friend)
    addFriend(friend);
  });

	function addFriend(friend){
		console.log('addFriend')
		console.log(friend)
		console.log(currentUser)
		console.log(currentUser['id'])
		//TODO?
		if( friend.id != currentUser.id && !friends[friend.id]){
			friends[friend.id]=friend 
		}
		
	}

	function getAll(){
		console.log('getAll')
  	return friends
  }

	function get(friendId) {
      // Simple index lookup
      return friends[friendId];
  }





	var service = {
		getAll: getAll,
		get: get
	};

	return service;

}    