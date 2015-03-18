function RoomService($cordovaLocalNotification, User, LBSocket, FriendService, $localstorage, $rootScope) {
	var DEBUG = false;
	console.log('RoomService');

	LBSocket.on('rooms:new', function(room) {	
    console.log('rooms:new');
		console.log(room);
    if(room.type=="private"){
			if(room.ownerId!=User.getCachedCurrent().id){
    		room.name=FriendService.get(room.ownerId).username
    	}
    	else{
    		room.name=FriendService.get(room.friend).username
    	}
    }
		console.log(room);
    addRoom(room);
    //join room
    console.log('room:join')
		LBSocket.emit('room:join', room.id, function(room) {
    	console.log('room:join callback')
			console.log(room)
		});
  });

  LBSocket.on('room:messages:new', function(message) {
  	console.log('room:messages:new');
  	console.log(message);
    addMessage(message);
  });

	var rooms = {};
	var _unreadMessages = [];
	var _currentRoomId = -1;
	
	function getAll() {
		console.log('getAll');
		return rooms;
	}

	function get(roomId) {
		if (angular.isUndefined(roomId)){
			roomId = _currentRoomId;
		}
		console.log(roomId);
		
		console.log(rooms[roomId]);

		if(!rooms[roomId].messages){
			rooms[roomId].messages = [];
		}	

		// console.log(rooms[roomId].messages);	

		return rooms[roomId];

	}

	//TODO
	function set(roomId) {
		_currentRoomId = roomId;
	}

	function addRoom(room) {
		console.log("addRoom="+room);
		if (!rooms[room.id]) {
			rooms[room.id] = room;
		} else {
			console.error('Duplicate room id: '+room.id);
		}
	}

	//TODO:?
	function addMessage(message) {
		console.log('addMessage');
		console.log(message);
		var room = get(message.roomId);
		console.log(room);
		console.log(_currentRoomId)
		if (room.id == _currentRoomId && !$rootScope.isInBackground) {
			room.messages.push(message);
			$rootScope.$broadcast('onNewMessage');
		} else {
			var unreadMessages = $localstorage.getObject(room.id);
			if (!unreadMessages) unreadMessages = [];
			unreadMessages.push(message);
			$localstorage.setObject(room.id, unreadMessages);
			room.unreadMessages = unreadMessages;
			// Sending the local notification.
			cordova.plugins.notification.local.schedule({
			// $cordovaLocalNotification.add({
	  		text: message.text,
	  		title: FriendService.get(message.ownerId).username,
	    }, function () {
	      if (DEBUG) console.log('New message notification has been added.');
	    });
		}
	}


	var service = {
		getAll: getAll,
		get: get,
		set: set,
		addRoom: addRoom,
		addMessage: addMessage
	};

	return service;

}  