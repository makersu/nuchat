function FriendService() {
	console.log('FriendService')

	// Some fake testing data
  var friends = [
    { id: 0, username: 'Scruff McGruff' },
    { id: 1, username: 'G.I. Joe' },
    { id: 2, username: 'Miss Frizzle' },
    { id: 3, username: 'Ash Ketchum' }
  ];

	function getAll(){
		console.log("FriendService getAll");  
		console.log(friends)    	
		return friends;
	};

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