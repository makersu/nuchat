function RoomService($q, $cordovaLocalNotification, User, LBSocket, FriendService, $localstorage, $rootScope, $checkFormat, $utils, $filter, $timeout, $compile, ENV, METATYPE, PouchService, $NUChatTags) {
	console.log('RoomService');
	var DEBUG = false;
	var rooms = {};
	var _unreadMessages = [];
	var _currentRoomId = -1;
	var _prevLatestMsg = null;
	var _filterBy = {};

	//when get new room created by self or others
	LBSocket.on('rooms:new', function(room) {
    console.log('on rooms:new');
		console.log(room);

		//add room then join room
		addRoom(room);

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
  			// addMessage(newMessageInfo.message);
  			$rootScope.$broadcast('uploaded', {msg: newMessageInfo.message});
  		}
  	}
  	else if (newMessageInfo.message.ownerId != User.getCachedCurrent().id) {
  		var message = newMessageInfo.message;
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
  	var lastMessageId = getLastMessageId(roomId)
  	if( lastMessageId ){
  		data.lastMessageId = lastMessageId
  	}
  	// console.log(data);

  	LBSocket.emit('room:messages:get', data , function(messages){
  		console.log('room:messages:get')
	    //console.log(messages)
	    console.log(messages.messages.length)
	    for (var i = 0; i < messages.messages.length; i++) {
	    	addMessage(messages.messages[i])
	    	// updateRoomInfo(messages.messages[i]);//???
	    }
	    if (!messages.messages.length) {
				grouping(getRoom(roomId));
	    }

	    $timeout(function() {
	    	// Insert the Unread-Note before the 1st message.
		    if (messages.messages.length) {
		    	var unread = document.getElementById('unreadStart');
		    	if (!unread) {
		    		var firstMsgEl = document.getElementById('item-'+messages.messages[0].id);
			    	var parentEl = angular.element(firstMsgEl).parent()[0];
			    	var note = angular.element($compile('<unread-note id="unreadStart"></unread-note>')($scope))[0];
			    	parentEl && parentEl.insertBefore(note, firstMsgEl);
		    	}
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
  	console.log('addMessage');
		// console.log(message);
		var room = getRoom(message.roomId);
		if (!message.id) {
			console.log('local adding');
			// console.log(message);
			message.id = message.timestamp; // For removing from view after updating from server.
			room.messages[message.timestamp] = message;
		} 
		else {
			room.messages[message.id] = message;
		}
		// console.log(room);
		// grouping(room);
		// console.log(room);
		
		$rootScope.$broadcast('onNewMessage', { msg: message });
  }

  function grouping(room, newMsg) {
  	// if ( newMsg && _prevLatestMsg && !$utils.sameDate(newMsg.created, _prevLatestMsg.created) ) {
   //    var groupName = $filter('amChatGrouping')(newMsg.created);
   //    room.viewMessages.push({type: METATYPE.GROUP, text: groupName});
   //    newMsg.group = groupName;
   //    room.viewMessages.push(newMsg);
   //  } else if (!_prevLatestMsg) {
	  room.viewMessages = $filter('groupDiv')(room.messages, function(msg) {
	    return $filter('amChatGrouping')(msg.created);
	  });
	  // console.log(room.viewMessages);
    // } else {
    // 	console.log('what!!!');
    //   // Append to the latest group.
    //   // getLastGroup(room).items.push(newMsg);
    //   newMsg.group = _prevLatestMsg.group;
    //   room.viewMessages.push(newMsg);
    // }
    // filtering(room);
    $NUChatTags.setItemList(room.viewMessages);
    room.tagList = $NUChatTags.getTagList().tags;
    // console.log(room);
    // _prevLatestMsg = angular.copy(newMsg);
  }

  function groupByDate(room) {
  	room.viewMessages = $filter('groupDiv')(room.viewMessages, 'group');
  }

  function getLastGroup(room, last) {
  	if (room.allGroupedMessages && room.allGroupedMessages.length)
  		return room.allGroupedMessages[room.allGroupedMessages.length-(last || 1)];
  	return null;
  }

  function isPrivate(room) {
  	// console.log('isPrivate');
  	// console.log(room)
  	return (room.type && room.type === 'private');
  }

  function isGroup(room) {
  	return room.type === 'group';
  }

  function filterByUser(room, userId) {
    _filterBy.ownerId = userId;
    filtering(room);
  }
  function filterByDate(room, date) {
    _filterBy.date = date;
    filtering(room);
  }
  function filtering(room) {
  	// console.log(_filterBy);
    room.viewMessages = angular.copy( $filter('filter')(_.values(room.messages), {group: _filterBy.date, ownerId: _filterBy.ownerId}) );
    // console.log(room.viewMessages);
    groupByDate(room);
    $NUChatTags.setItemList(room.viewMessages);
    room.tagList = $NUChatTags.getTagList().tags;
    
    // angular.forEach(room.viewMessages, function(group) {
    //   group.items = $filter('filter')(group.items, { ownerId: _filterBy.ownerId });
    //   console.log(group.items);
    // });
    // room.viewMessages = $filter('filter')(room.viewMessages, { ownerId: _filterBy.ownerId });
    // console.log(room.groupedMessages);
    // console.log(room.allGroupedMessages);
  }
  function getAllGroups(room) {
    _filterBy = {};
    filtering(room);
  }

	//getAllRooms
	function getAllRooms() {
		console.log('getAllRooms');

		emitGetAllRooms();
		
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
	function emitGetAllRooms(){
		console.log('emitGetAllRooms');
		LBSocket.emit('rooms:get', { user: User.getCachedCurrent().id }, function(err, roomObjs) {
			if (err) {
				console.error(err);
			}
			else{
					addRooms(roomObjs);
			}			
		});
	}

	function addRooms(rooms) {
		console.log('addRooms');
		console.log(rooms.length);
		// console.log(rooms);
		rooms.forEach(function(room){
			addRoom(room);
		});
	}

	//addRoom then joinRoom
	function addRoom(room) {
		console.log('addRoom')
		// console.log(room);

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
				console.log('emit room:info');
					if (err) {
					console.error(err);
					return;
				}
				// console.log(roomInfo);
				updateRoomInfo(roomInfo);
			});//room:messages:last

		});//room:join

	}

	function createGroupRoom(newRoom){
		console.log('createGroupRoom')
		console.log(newRoom)
		LBSocket.emit('rooms:create:group', newRoom)
	}
	
	function getRoom(roomId) {
		return rooms[roomId];
	}

	function setCurrentRoom(roomId) {
		console.log(roomId);//
		_currentRoomId = roomId;
		_filterBy = {};
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
		console.log('getLastMessage');
		// console.log(roomId);
		var room = getRoom(roomId);
		console.log(room);//
		var lastMessage;
		if(room.messages){
			var lastKeyIndex=Object.keys(room.messages).length - 1
			console.log(lastKeyIndex);//

			lastMessage= room.messages[Object.keys(room.messages)[lastKeyIndex]]
			// console.log(lastMessage);
		}
		return lastMessage;	
	}

	function getLastMessageId(roomId) {
		console.log('getLastMessageId');
		console.log(roomId)
		var lastMessage=getLastMessage(roomId)
		console.log(lastMessage);//
		var lastMessageId;

		if(lastMessage){
			lastMessageId=lastMessage.id;
		}

		return lastMessageId;	
	}

	function createMessage(newMessage){
		console.log('emit room:messages:new')
		LBSocket.emit('room:messages:new', newMessage);
	}

	function removeAll(){
		rooms = {};
	}

	getAllRooms();//

	var service = {
		rooms: rooms,
		getAllRooms: getAllRooms,
		createGroupRoom: createGroupRoom,
		setCurrentRoom: setCurrentRoom,
		getCurrentRoom: getCurrentRoom,
		getRoomMessages: getRoomMessages,
		filterByUser: filterByUser,
		filterByDate: filterByDate,
		getAllGroups: getAllGroups,
		createMessage: createMessage,
		addMessage: addMessage,
		getLastGroup: getLastGroup,
		isPrivate: isPrivate,
		isGroup: isGroup,
		removeAll: removeAll,
		grouping: grouping,
		filterByUser: filterByUser,
		filterByDate: filterByDate,
		getAllGroups: getAllGroups,
	};

	return service;

}  