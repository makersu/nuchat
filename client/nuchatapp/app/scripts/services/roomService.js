function RoomService(LBSocket, $localstorage) {
	console.log('RoomService');

	LBSocket.on('rooms:new', function(room) {
    console.log('rooms:new');
		console.log(angular.toJson(room));
    //$scope.availableRooms.push(room);//todo
    addRoom(room);
  });

  LBSocket.on('room:messages:new', function(message) {
  	console.log('room:messages:new');
  	console.log(message);
  	//$scope.room.messages.push(message)
    addMessage(message);

		//self.addMessage(message);
  });

	var rooms = {};
	var _unreadMessages = [];
	var _currentRoomId = -1;
	
	function getAll() {
		console.log('getAll');
		return rooms;
	}

	function get(roomId) {
		if (angular.isUndefined(roomId)) roomId = _currentRoomId;
		console.log(roomId);
		// for(var i=0; i< rooms.length;i++){
		console.log(rooms[roomId]);
			// if(rooms[i].id==roomId){
		console.log('room.messages='+rooms[roomId].messages);
		if (!rooms[roomId].messages) {
			rooms[roomId].messages = [];
		}
		return rooms[roomId];
			// }
		// }
	}

	function set(roomId) {
		_currentRoomId = roomId;
	}

	function addRoom(room) {
		console.log("addRoom="+room);
		// for(var i=0; i< rooms.length;i++){
		// 	if(rooms[i].id==room.id){
		// 		return;
		// 	}	
		// }
		// rooms.push(room);//todo
		if (!rooms[room.id]) {
			rooms[room.id] = room;
		} else {
			console.error('Duplicate room id: '+room.id);
		}
	}

/*
	function addRoom(room){
		console.log("addRoom")
		console.log(rooms[room.id])
		if(!rooms[room.id]){
			rooms[room.id]=room
		}
		
	}
*/

	//TODO:?
	function addMessage(message) {
		console.log('addMessage');
		console.log(message);
		var room = get(message.roomId);
		console.log(room);
		if (room.id == _currentRoomId) {
			room.messages.push(message);
		} else {
			var unreadMessages = $localstorage.getObject(room.id);
			console.log(unreadMessages);
			if (!unreadMessages) unreadMessages = [];
			unreadMessages.push(message);
			$localstorage.setObject(room.id, unreadMessages);
			room.unreadMessages = unreadMessages;
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