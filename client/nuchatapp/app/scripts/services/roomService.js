function RoomService($cordovaLocalNotification, User, LBSocket, FriendService, $localstorage, $rootScope) {
	var DEBUG = false;
	console.log('RoomService');

	//when get new room
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
		//console.log(room);
    addRoom(room);

    //join room 
		LBSocket.emit('room:join', room.id, function(joinedRoom) {
    	console.log('room:join callback')
			console.log(joinedRoom)
			var data = {}
			data.roomId=joinedRoom.id
			console.log(data)
			//get latest message of room
			LBSocket.emit('room:messages:latest', data , function(latestMessageInfo){
				console.log('room:messages:latest')
				console.log(latestMessageInfo)
				updateLatestMessageInfo(latestMessageInfo)
			});//room:messages:last

		});//room:join

  });//rooms:new

	//when get new message
  LBSocket.on('room:messages:new', function(newMessageInfo) {
  	console.log('room:messages:new');
  	console.log(newMessageInfo);
  	updateLatestMessageInfo(newMessageInfo);
  	if (newMessageInfo.message.roomId == _currentRoomId && !$rootScope.isInBackground) {
  		// syncMessage(data.message)
  		addMessage(newMessageInfo.message)
  	}
  	else{
  		var message=newMessageInfo.message
			// Sending the local notification.
			cordova.plugins.notification.local.schedule({
			// $cordovaLocalNotification.add({
	  		text: message.text,
	  		title: FriendService.get(message.ownerId).username,
	    }, function () {
	      if (DEBUG) console.log('New message notification has been added.');
	    });
	  }  
  });

  function getRoomMessages(roomId){
  	var data = {}
  	data.roomId=roomId
  	var lastMessage= getLastMessage(roomId)
  	if(lastMessage && lastMessage.id){
  		data.messageId = lastMessage.id
  	}
  	console.log(data)

  	LBSocket.emit('room:messages:get', data , function(messages){
  		console.log('room:messages:get')
	    //console.log(messages)
	    console.log(messages.messages.length)
	    for(var i=0;i<messages.messages.length;i++){
	    	addMessage(messages.messages[i])//updateLatestMessageInfo?
	    }
	  });
  }

  //TODO:?
  function addMessage(message) {
  	console.log('addMessage');
		console.log(message);
		var room = getRoom(message.roomId);
		console.log(room);
		room.messages[message.id]=message
		console.log(room.messages)
		$rootScope.$broadcast('onNewMessage');
  }



  //sync message from server?
 //  function syncMessage(message){
 //  	console.log('syncMessage')
 //  	console.log(message)

 //  	var data = {}
  	
 //  	var lastMessage= getLastMessage(message.roomId)
 //  	if(lastMessage && lastMessage.id){
 //  		data.messageId = lastMessage.id
 //  	}
 //  	console.log(data)

 //  	LBSocket.emit('room:messages:get', data , function(messages){
 //  		console.log('room:messages:get')
	//     //console.log(messages)
	//     console.log(messages.messages.length)
	//     for(var i=0;i<messages.messages.length;i++){
	//     	addMessage(messages.messages[i])
	//     }
 //  	});

	// }//syncMessage
 

	var rooms = {};
	var _unreadMessages = [];
	var _currentRoomId = -1;
	
	function getAvailableRooms() {
		console.log('getAvailableRooms');
		getAllRooms();
		return rooms;
	}

	//get all rooms related to user
	function getAllRooms(){
    console.log('rooms:get');
    LBSocket.emit('rooms:get',User.getCachedCurrent());
	}

	function createRoom(newRoom){
		console.log('createRoom')
		console.log(newRoom)
		LBSocket.emit('rooms:create', newRoom)
	}
	
	function getRoom(roomId) {
		return rooms[roomId];
	}

	function setCurrentRoom(roomId) {
		_currentRoomId = roomId;
	}

	function getCurrentRoom() {
		return rooms[_currentRoomId];
	}

	function addRoom(room) {
		console.log('addRoom')
		console.log(room);
		if (!rooms[room.id]) {
			room.messages = {};//
			rooms[room.id] = room;
		} else {
			console.error('Duplicate room id: '+room.id);
		}
	}

	function updateLatestMessageInfo(data){
		console.log('updateLatestMessage')
		console.log(data)
		if(data.message){
			var room = getRoom(data.message.roomId)
			room.latestMessage=data.message
			room.total=data.total
			console.log(Object.keys(room.messages).length)//
			room.unread=data.total-Object.keys(room.messages).length
		}
	}

	//TODO:?
	// function addMessage(message) {
	// 	console.log('addMessage');
	// 	console.log(message);
	// 	var room = getRoom(message.roomId);
	// 	console.log(room);
	// 	console.log(_currentRoomId)
	// 	if (room.id == _currentRoomId && !$rootScope.isInBackground) {
	// 		//room.messages.push(message);
	// 		room.messages[message.id]=message
	// 		console.log(room.messages)
	// 		$rootScope.$broadcast('onNewMessage');
	// 	} else {
	// 		// var unreadMessages = $localstorage.getObject(room.id);
	// 		// if (!unreadMessages) unreadMessages = [];
	// 		// unreadMessages.push(message);
	// 		// $localstorage.setObject(room.id, unreadMessages);
	// 		// room.unreadMessages = unreadMessages;
			
	// 		// console.log(message.ownerId)
	// 		// console.log(FriendService.get(message.ownerId))

	// 		if(message.ownerId === User.getCachedCurrent().id){
	// 			return;
	// 		}
	// 		else {
	// 			// Sending the local notification.
	// 			cordova.plugins.notification.local.schedule({
	// 			// $cordovaLocalNotification.add({
	// 	  		text: message.text,
	// 	  		title: FriendService.get(message.ownerId).username,
	// 	    }, function () {
	// 	      if (DEBUG) console.log('New message notification has been added.');
	// 	    });
	// 	  }  
	// 	}
	// }

	//TODO:?
	function getLastMessage(roomId) {
		console.log('getLastMessage')
		console.log(roomId)
		var room = getRoom(roomId);
		var lastMessage={}
		if(room.messages){
			var lastKeyIndex=Object.keys(room.messages).length - 1
			console.log(lastKeyIndex)

			lastMessage= room.messages[Object.keys(room.messages)[lastKeyIndex]]
			console.log(lastMessage)
		}
		return lastMessage;	
	}

	function createMessage(newMessage){
		console.log('room:messages:new')
		LBSocket.emit('room:messages:new', newMessage);
	}


	var service = {
		getAvailableRooms: getAvailableRooms,
		createRoom: createRoom,
		setCurrentRoom: setCurrentRoom,
		getCurrentRoom: getCurrentRoom,
		getRoomMessages: getRoomMessages,
		createMessage: createMessage
	};

	return service;

}  