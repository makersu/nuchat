function RoomService($cordovaLocalNotification, User, LBSocket, FriendService, $localstorage, $rootScope, $checkFormat, $utils, $filter, $timeout, $compile, ENV, METATYPE) {
	var DEBUG = false;
	var _prevLatestMsg = null;
	console.log('RoomService');

	//when get new room
	LBSocket.on('rooms:new', function(room) {	
    console.log('rooms:new');
		console.log(room);
    if( isPrivate(room) ) {
    	$timeout(function() {
    		var friend = FriendService.get(room.ownerId != User.getCachedCurrent().id ? room.ownerId : room.friend);
	    	console.log(FriendService.friends);
	    	console.log(room.ownerId != User.getCachedCurrent().id ? room.ownerId : room.friend);
	    	console.log(FriendService.get(room.ownerId != User.getCachedCurrent().id ? room.ownerId : room.friend));
	    	console.log(friend);
	    	if (friend) {
	    		room.name = friend.username;
	  			room.profile = friend.avatarThumbnail;
	    	}
    	});
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
  	console.log(_currentRoomId);
  	updateLatestMessageInfo(newMessageInfo);
  	if (newMessageInfo.message.roomId == _currentRoomId && !$rootScope.isInBackground) {
  		// syncMessage(data.message)
  		// Checking the owner of the coming message, processing if not self or only text or link type.
  		if (newMessageInfo.message.ownerId != User.getCachedCurrent().id ||
  			!newMessageInfo.message.type || newMessageInfo.message.type === METATYPE.LINK) {
  			addMessage(newMessageInfo.message);
  		} else if ( newMessageInfo.message.ownerId == User.getCachedCurrent().id &&
  								( $checkFormat.isImg(newMessageInfo.message.type) ||
  								  $checkFormat.isAudio(newMessageInfo.message.type) ||
  								  $checkFormat.isVideo(newMessageInfo.message.type) )
  							) {
  			// addMessage(newMessageInfo.message);
  			$rootScope.$broadcast('uploaded', {msg: newMessageInfo.message});
  		}
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
  	// console.log(data);

  	LBSocket.emit('room:messages:get', data , function(messages){
  		console.log('room:messages:get')
	    //console.log(messages)
	    console.log(messages.messages.length)
	    for(var i=0;i<messages.messages.length;i++){
	    	addMessage(messages.messages[i])//updateLatestMessageInfo?
	    }

	    $timeout(function() {
	    	// Insert the Unread-Note before the 1st message.
		    if (messages.messages.length) {
		    	var firstMsgEl = document.getElementById(messages.messages[0].id);
		    	var parentEl = angular.element(firstMsgEl).parent()[0];
		    	var note = angular.element($compile('<unread-note id="unreadStart"></unread-note>')($scope))[0];
		    	parentEl.insertBefore(note, firstMsgEl);
		    } else {
		    	var msgContainer = document.getElementById('msgContainer');
		    	var unread = document.getElementById('unreadStart');
		    	if (unread) {
		    		angular.element(unread).remove();
		    	}
		    	console.log('set unreadstart');
		    	angular.element(msgContainer).find('div').eq(0).append('<div id="unreadStart"></div>');
		    }
	    });
	  });
  }

  //TODO:?
  function addMessage(message) {
  	// console.log('addMessage');
		// console.log(message);
		var room = getRoom(message.roomId);
		if (!message.id) {
			console.log('local adding');
			console.log(message);
			message.id = message.timestamp; // For removing from view after updating from server.
			room.messages[message.timestamp] = message;
		} else {
			room.messages[message.id] = message;
		}
		// console.log(room);
		grouping(room, message);
		console.log(room);
		
		$rootScope.$broadcast('onNewMessage', { msg: message });
  }

  function grouping(room, newMsg) {
  	if ( _prevLatestMsg && !$utils.sameDate(newMsg.created, _prevLatestMsg.created) ) {
      var msgs = {};
      msgs[newMsg.id] = newMsg;
      var newGroup = $filter('groupBy')(msgs, 'created', function(msg) {
          return $filter('amChatGrouping')(msg.created);
      });
      room.groupedMessages = room.groupedMessages.concat(newGroup);
    } else if (!_prevLatestMsg) {
      room.groupedMessages = $filter('groupBy')(room.messages, 'created', function(msg) {
        return $filter('amChatGrouping')(msg.created);
      });
      // Open the latest group.
      getLastGroup(room).open = true;
    } else {
      // Append to the latest group.
      getLastGroup(room).items.push(newMsg);
    }
    _prevLatestMsg = angular.copy(newMsg);
  }

  function getLastGroup(room, last) {
  	if (room.groupedMessages && room.groupedMessages.length)
  		return room.groupedMessages[room.groupedMessages.length-(last || 1)];
  	return null;
  }

  function isPrivate(room) {
  	return room.type === 'private';
  }

  function isGroup(room) {
  	return room.type === 'group';
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

	function removeAll(){
		rooms = {};
	}

	var service = {
		getAvailableRooms: getAvailableRooms,
		createRoom: createRoom,
		setCurrentRoom: setCurrentRoom,
		getCurrentRoom: getCurrentRoom,
		getRoomMessages: getRoomMessages,
		createMessage: createMessage,
		addMessage: addMessage,
		getLastGroup: getLastGroup,
		isPrivate: isPrivate,
		isGroup: isGroup,
		removeAll: removeAll,
		grouping: grouping,
	};

	return service;

}  