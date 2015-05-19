function RoomService($q, $cordovaLocalNotification, User, LBSocket, FriendService, $localstorage, $rootScope, $checkFormat, $utils, $filter, $timeout, $compile, ENV, METATYPE, PouchService) {
	console.log('RoomService');
	var DEBUG = false;
	var rooms = {};
	var _unreadMessages = [];
	var _currentRoomId = -1;
	var _prevLatestMsg = null;

	//when get new room created by self or others
	LBSocket.on('rooms:new', function(room) {
    console.log('on rooms:new');
		console.log(room);

		//add room then join room
		addRoom(room);

		//TODO: addroom/joinroom failed if saveRoom failed
		PouchService.saveRoom(room).then(function(doc){
			console.log(doc);
			// addRoom(doc);
		},function(err){
			console.log(err);
		});//end PouchService.saveRoom

  });//rooms:new

	//when get new message
  LBSocket.on('room:messages:new', function(newMessageInfo) {
  	console.log('room:messages:new');
  	console.log(newMessageInfo);
  	console.log(_currentRoomId);
  	updateRoomInfo({lastMessage: newMessageInfo.message, total: newMessageInfo.total});//???
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
  			addMessage(newMessageInfo.message);
  			$rootScope.$broadcast('uploaded', {msg: newMessageInfo.message});
  		}
  	}
  	else{
  		var message=newMessageInfo.message
			// Sending the local notification.
			cordova.plugins.notification.local.schedule({
			// $cordovaLocalNotification.add({
	  		text: message.text,
	  		title: FriendService.getFriend(message.ownerId).username,
	    }, function () {
	      if (DEBUG) console.log('New message notification has been added.');
	    });
	  }  
  });

	//TODO: get everytime when enter room?if current room dont get?
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
	    	addMessage(messages.messages[i])
	    	// updateRoomInfo(messages.messages[i]);//???
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
			room.messages[message.timestamp] = message;
		} 
		else {
			room.messages[message.id] = message;
			if (message.timestamp) {
				console.log('timestamp');
				console.log(room.messages[message.timestamp]);
				delete room.messages[message.timestamp];
			}
		}
		// console.log(room);
		// console.log(room.messages);
		grouping(room, message);
		
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

  function getLastGroup(room) {
  	if (room.groupedMessages && room.groupedMessages.length)
  		return room.groupedMessages[room.groupedMessages.length-1];
  	return null;
  }

  function isPrivate(room) {
  	console.log('isPrivate');
  	console.log(room)
  	return (room.type && room.type === 'private');
  }

  function isGroup(room) {
  	return room.type === 'group';
  }

	//getAllRooms
	function getAllRooms() {
		console.log('getAllRooms');

		// loadRooms();

		emitGetRooms();
		
  	return rooms;
	}

	//load rooms from pouchdb
	function loadAllRooms(){
		PouchService.getRooms().then(function(rows){
			console.log(rows);
			rows.forEach(function(row){
				console.log(row);
				addRoom(row.key);
			})
		})
	}

	//TODO: refactoring rename and PouchService?
	function emitGetRooms(){
		LBSocket.emit('rooms:get', { user: User.getCachedCurrent().id }, function(err, roomObjs) {
			if (err) {
				console.error(err);
				return;
			}
			
			roomObjs.forEach(function(roomObj){
				addRoom(roomObj);
				PouchService.saveRoom(roomObj).then(function(doc){
					// console.log(doc);
					// addRoom(doc);
				},function(err){
					console.log(err);
				});//end PouchService.saveRoom
			});//end roomObjs
			
		});
	}

	//addRoom then joinRoom
	function addRoom(room) {
		console.log('addRoom')
		console.log(room);

		if( isPrivate(room) ) {
    	// $timeout(function() {
				var friend;
	    	// console.log(room.joiners)
	    	room.joiners.forEach(function(joiner){
	    		// console.log(joiner)
	    		if(joiner != User.getCachedCurrent().id){
	    			friend=FriendService.getFriend(joiner)
	    			// console.log(friend);
	    		}
	    	})
	    	console.log(friend);
	    	//if private and it's friend
	    	if (friend && !rooms[room.id]) {
	    		room.name = friend.username;
	  			room.profile = friend.avatarThumbnail;
	  			room.messages = {};
			    // console.log(room);
					rooms[room.id] = room;
					joinRoom(room);
	    	}
    	// });
    }
    else{
			if(!rooms[room.id]){
				room.messages = {};
				rooms[room.id] = room;
				joinRoom(room);
			}
		}

	}

	function joinRoom(room){
		console.log('joinRoom');
		console.log(room);

		LBSocket.emit('room:join', {room: room.id}, function(err, roomObj) {
			console.log('room:join');
			if (err) {
				console.error(err);
				return;
			}
			console.log(roomObj);

			LBSocket.emit('room:info', {room: roomObj.id} , function(err, roomInfo){
				console.log('room:info');
					if (err) {
					console.error(err);
					return;
				}
				// console.log(roomInfo);
				updateRoomInfo(roomInfo);
			});//room:messages:last

		});//room:join

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
		console.log(roomId);//
		_currentRoomId = roomId;
	}

	function getCurrentRoom() {
		console.log(_currentRoomId);//
		// console.log(rooms)
		// console.log(rooms[_currentRoomId])
		return rooms[_currentRoomId];
	}

	//TODO: refactoring reanme room.lastMessage?
	function updateRoomInfo(roomInfo){
		console.log('updateRoomInfo');
		console.log(roomInfo)

		if(roomInfo.lastMessage){
			var room = getRoom(roomInfo.lastMessage.roomId)
			room.lastMessage=roomInfo.lastMessage
			// room.total=roomInfo.total
			var unread = roomInfo.total-Object.keys(room.messages).length
			console.log(unread);
			room.unread= (unread > 0) ? unread : 0 ;
		}
	}

	//TODO:?
	function getLastMessage(roomId) {
		console.log('getLastMessage')
		console.log(roomId)
		var room = getRoom(roomId);
		console.log(room);//
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
		console.log('emit room:messages:new')
		LBSocket.emit('room:messages:new', newMessage);
	}

	function removeAll(){
		rooms = {};
	}

	var service = {
		getAllRooms: getAllRooms,
		createRoom: createRoom,
		setCurrentRoom: setCurrentRoom,
		getCurrentRoom: getCurrentRoom,
		getRoomMessages: getRoomMessages,
		createMessage: createMessage,
		addMessage: addMessage,
		getLastGroup: getLastGroup,
		isPrivate: isPrivate,
		isGroup: isGroup,
		removeAll: removeAll
	};

	return service;

}  