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
    
		LBSocket.emit('room:join', room.id, function(joinedRoom) {
    	console.log('room:join callback')
			console.log(joinedRoom)
			var data = {}
			data.roomId=joinedRoom.id

			var room = get(joinedRoom.id);
			console.log(room)
			// if(room){
			// 	if(room.messages){
			// 		var lastMessage= room.messages[room.messages.length-1]
			// 		console.log(lastMessage)
			// 		if(lastMessage){
			// 			data.messageId = lastMessage.id
			// 		}
			// 	}
			// }			
			
			console.log(data)
			// LBSocket.emit('room:messages:get', data , function(messages){
			// 	console.log('room:messages:get')
			// 	//console.log(messages)
			// 	console.log(messages.messages.length)
			// 	for(var i=0;i<messages.messages.length;i++){
			// 		addMessage(messages.messages[i])
			// 	}

			// });
			LBSocket.emit('room:messages:latest', data , function(data){
				console.log('room:messages:latest')
				console.log(data)
				updateLatestInfo(data)
			});//room:messages:last

		});//room:join

  });

  LBSocket.on('room:messages:new', function(data) {
  	console.log('room:messages:new');
  	console.log(data);
  	updateLatestInfo(data)
  	//addMessage(message);
  	if (data.message.roomId == _currentRoomId && !$rootScope.isInBackground) {
  		syncMessage(data.message)
  	}
		
    
  });

  //sync message from server?
  function syncMessage(message){
  	console.log('syncMessage')
  	console.log(message)

  	var data = {}
  	
  	var lastMessage= getLastMessage(message.roomId)
  	if(lastMessage && lastMessage.id){
  		data.messageId = lastMessage.id
  	}
  	console.log(data)

  	LBSocket.emit('room:messages:get', data , function(messages){
  		console.log('room:messages:get')
	    //console.log(messages)
	    console.log(messages.messages.length)
	    for(var i=0;i<messages.messages.length;i++){
	    	addMessage(messages.messages[i])
	    }
  	});

	}//syncMessage
 

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
		
		// if(!rooms[roomId]){
		// 	rooms[roomId]={}
		// 	rooms[roomId].messages = [];
		// }

		return rooms[roomId];
	}

	//TODO
	function set(roomId) {
		_currentRoomId = roomId;
	}

	function addRoom(room) {
		console.log('addRoom')
		console.log(room);
		if (!rooms[room.id]) {
			room.messages={}//
			rooms[room.id] = room;
		} else {
			console.error('Duplicate room id: '+room.id);
		}
	}

	function updateLatestInfo(data){
		console.log('updateLatestMessage')
		console.log(data)
		var room = get(data.message.roomId)
		room.latestMessage=data.message
		room.total=data.total
		// console.log(room.messages.length)
		// room.unread=data.total-room.messages.length
		console.log(Object.keys(room.messages).length)//
		room.unread=data.total-Object.keys(room.messages).length
		
	}

	//TODO:?
	function addMessage(message) {
		console.log('addMessage');
		console.log(message);
		var room = get(message.roomId);
		console.log(room);
		console.log(_currentRoomId)
		if (room.id == _currentRoomId && !$rootScope.isInBackground) {
			//room.messages.push(message);
			room.messages[message.id]=message
			console.log(room.messages)
			$rootScope.$broadcast('onNewMessage');
		} else {
			// var unreadMessages = $localstorage.getObject(room.id);
			// if (!unreadMessages) unreadMessages = [];
			// unreadMessages.push(message);
			// $localstorage.setObject(room.id, unreadMessages);
			// room.unreadMessages = unreadMessages;
			
			// console.log(message.ownerId)
			// console.log(FriendService.get(message.ownerId))

			if(message.ownerId === User.getCachedCurrent().id){
				return;
			}
			else {
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
	}

	//TODO:?
	function getLastMessage(roomId) {
		console.log('getLastMessage')
		console.log(roomId)
		var room = get(roomId);
		var lastMessage={}
		if(room.messages){
			var lastkey=Object.keys(room.messages).length - 1
			console.log(lastkey)

			lastMessage= room.messages[Object.keys(room.messages)[lastkey]]
			console.log(lastMessage)
		}
		return lastMessage;	
	}


	var service = {
		getAll: getAll,
		get: get,
		set: set,
		addRoom: addRoom,
		addMessage: addMessage,
		getLastMessage: getLastMessage
	};

	return service;

}  