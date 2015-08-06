function RoomService($q, $cordovaLocalNotification, User, LBSocket, FriendService, $localstorage, $rootScope, $checkFormat, $utils, $filter, $timeout, $compile, ENV, METATYPE, $NUChatTags) {
	console.log('RoomService');
	var DEBUG = false;
	var rooms = {};
	var _unreadMessages = [];
	var _currentRoomId = -1;
	var _prevLatestMsg = null;
	var _filterBy = {};
	var _lastReadMessageId = null;

	/**
	 * WebSocket Events
	 */
	// TODO: clean up
	 
	//when get new room created by self or others
	LBSocket.on('rooms:new', function(room) {
    console.log('on rooms:new');
		console.log(room);

		//add room then join room
		addRoom(room);
  });//rooms:new

	//TODO: update joinerList in chatCtrl
	LBSocket.on('rooms:group:update', function(updatedRoom) {
    console.log('on rooms:group:update');
		console.log(updatedRoom);
		var room=getRoom(updatedRoom.id);
		// console.log(room);
		if(room){
			room.name=updatedRoom.name;
			room.description=updatedRoom.description;
			room.joiners=updatedRoom.joiners;
		}

  });//rooms:group:update

  LBSocket.on('rooms:group:remove', function(room) {
    console.log('on rooms:group:remove');
		console.log(room);
  });//rooms:group:remove


	//when get new message
	// TODO: Need to clean up and refactor
  LBSocket.on('room:messages:new', function(newMessageInfo) {
		console.log('room:messages:new');
		console.log(newMessageInfo);
		console.log(_currentRoomId);
		//updateRoomInfo({lastMessage: newMessageInfo.message, total: newMessageInfo.total});//???
		updateRoomLatestMessage(newMessageInfo.message);
		// emitGetLastReadMessageInfo(newMessageInfo.message.roomId, User.getCachedCurrent().id);//???

  	if (newMessageInfo.message.roomId == _currentRoomId && !$rootScope.isInBackground) {
  		// syncMessage(data.message)
  		// Checking the owner of the coming message, processing if not self or only text or link type.
  		if (newMessageInfo.message.ownerId != User.getCachedCurrent().id ||
  			!newMessageInfo.message.type || newMessageInfo.message.type === METATYPE.LINK) {
  			addMessage(newMessageInfo.message);
				emitUpdateRoomLastReadMessage(newMessageInfo.message);
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
			emitGetLastReadMessageInfo(newMessageInfo.message.roomId, User.getCachedCurrent().id);

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


	/* Private methods */
  function getRoom(roomId) {
		return rooms[roomId];
	}
	
  function groupByDate(room) {
  	room.viewMessages = $filter('groupDiv')(room.viewMessages, 'group');
  }

  function filtering(room) {
  	// console.log(_filterBy);
    room.viewMessages = angular.copy( $filter('filter')(_.values(room.messages), {group: _filterBy.date, ownerId: _filterBy.ownerId}) );
    // console.log(room.viewMessages);
    groupByDate(room);
    $NUChatTags.refreshTagList(room.viewMessages);
    room.tagList = $NUChatTags.getTagList();
  }

  function addRooms(newRooms) {
  	if (DEBUG) {	// Debugging logs
  		console.log('addRooms');
			console.log(newRooms.length);
  	}
		newRooms.forEach(function(newRoom) {
			addRoom(newRoom);
		});
	}

	function addRoom(newRoom) {
		if (DEBUG) {	// Debugging logs
			console.log('addRoom');
			console.log(newRoom);
		}

		if ( isPrivate(newRoom) ) {	// Private room
    	if (newRoom.joiners) {
    		var friend;
	    	DEBUG && console.log(room.joiners);
	    	newRoom.joiners.forEach(function(joiner) {
	    		if (joiner != User.getCachedCurrent().id) {
	    			friend = FriendService.getFriend(joiner)
	    		}
	    	});
	    	DEBUG && console.log(friend); // Debugging log
	    	// if private and it's friend
	    	if (friend) {
	    		// Creates room if not exists.
	    		if (!rooms[newRoom.id]) {
		    		newRoom.name = friend.username;
		  			newRoom.roomThumbnail = friend.avatarThumbnail;
		  			newRoom.messages = {};
				    // console.log(room);
						rooms[newRoom.id] = newRoom;
	    		}
	    		// Joins the room.
					joinRoom(newRoom.id);
				} else {	// No friends...
					console.warn('!friend');
					console.warn(newRoom.joiners)
				}	
    	} else {	// No joiners
    		console.warn('!room.joiners')
    	}
    } else {	// Group room
    	// Creates room if not exists.
			if (!rooms[newRoom.id]) {
				newRoom.messages = {};
				rooms[newRoom.id] = newRoom;
			}
			// Joins the room;
			joinRoom(newRoom.id);
		}
	}

	// TODO: join room then update room last message and last read message?
	function joinRoom(roomId) {
		if (DEBUG) {	// Debugging logs
			console.log('joinRoom');
			console.log(roomId);
		}

		LBSocket.emit('room:join', {roomId: roomId}, function(err, roomObj) {
			DEBUG && console.log('room:join');	// Debugging log
			if (err) {
				console.error(err);
				return;
			}
			DEBUG && console.log(roomObj);	// Debugging log

			emitGetRoomLatestMessage(roomObj.id);
			emitGetLastReadMessageInfo(roomObj.id, User.getCachedCurrent().id);
		});
	}

	function emitGetRoomLatestMessage(roomId) {
		DEBUG && console.log('emitGetRoomLatestMessage'); // Debugging log

    LBSocket.emit('room:messages:latest', {roomId: roomId} , function(err, latestMessage) {
    	if (DEBUG) {	// Debugging logs
    		console.log('room:messages:latest');
      	console.log(latestMessage);
    	}
      if (err) {
      	console.error(err);
      } else {
      	updateRoomLatestMessage(latestMessage);
      }
		});

	}

	function updateRoomLatestMessage(latestMessage) {
		DEBUG && console.log('updateRoomLatestMessage'); // Debugging log
		if (latestMessage) {
			getRoom(latestMessage.roomId).latestMessage = latestMessage;
		}
	}

	// TODO: rename
	function emitGetLastReadMessageInfo(roomId, userId) {
		DEBUG && console.log('emitGetLastReadMessageInfo'); // Debugging log

    LBSocket.emit('room:lastReadMessage:get', {roomId: roomId, userId: userId}, function(err, lastReadMessageInfo) {
    	if (DEBUG) {	// Debugging logs
	      console.log('room:lastReadMessage:get');
	      console.log(lastReadMessageInfo);
	    }

      if (err) {
      	console.error(err);
      } else {
      	if (lastReadMessageInfo.unreadCount >= 0) {
					getRoom(roomId).unreadCount = lastReadMessageInfo.unreadCount;
					// console.log(getRoom(roomId).unreadCount);//
					getRoom(roomId).lastReadMessageId = lastReadMessageInfo.lastReadMessageId; //need?
					// console.log(getRoom(roomId).lastReadMessageId);//need?

					// To check if in the chatroom and set the id of the last read message
					var msgContainer = document.getElementById('msgContainer');
					if (msgContainer) {
						if (lastReadMessageInfo.lastReadMessageId) {
							_lastReadMessageId = lastReadMessageInfo.lastReadMessageId;
							console.log('Yes lastReadMessageId: '+_lastReadMessageId);
						}
					}
				}
      }
		});
	}


	/* Room operations */

	/**
	 * @ngdoc method
	 * @name RoomService.createGroupRoom
	 * @description Creates a group room.
	 * @param {object} newRoom New room object contains the related info.
	 */
	function createGroupRoom(newRoom) {
		if (DEBUG) {	// Debugging logs
			console.log('createGroupRoom');
			console.log(newRoom);
		}
		LBSocket.emit('rooms:group:create', newRoom);
	}

	/**
	 * @ngdoc method
	 * @name RoomService.updateGroupRoom
	 * @description Updates the given group room.
	 * @param {object} updateRoom The room object to update.
	 */
	function updateGroupRoom(updateRoom) {
		if (DEBUG) {	// Debugging logs
			console.log('updateGroupRoom');
			console.log(updateRoom);
		}
		LBSocket.emit('rooms:group:update', updateRoom, function(err, obj) {
			if (err) {
				console.error(err);
			}
		});
	}

	/**
	 * @ngdoc method
	 * @name RoomService.createPrivateRoom
	 * @description Creates a new private room.
	 * @param {object} privateroom New room object contains the related info.
	 * @returns {object} The promise of created status from server.
	 */
	function createPrivateRoom(privateroom) {
		if (DEBUG) {	// Debugging logs
			console.log('createPrivateRoom');
			console.log(privateroom);
		}
		
		var deferred = $q.defer();
    LBSocket.emit('rooms:private:create', privateroom, function(err, room) {
      DEBUG && console.log('rooms:private:create callback'); // Debugging log
      if (err) {
      	deferred.reject(err);
      } else {
      	DEBUG && console.log(room); // Debugging log
      	deferred.resolve(room);
      }
		});
		return deferred.promise;
	}

	/**
	 * @ngdoc method
	 * @name RoomService.getRooms
	 * @description Gets all local cahced rooms.
	 * @returns {object} All rooms object.
	 */
	function getRooms() {
  	return rooms;
	}
	
	/**
	 * @ngdoc method
	 * @name RoomService.emitGetAllRooms
	 * @description Emits to get all rooms related to the current user.
	 */
	function emitGetAllRooms() {
		if (DEBUG) {	 // Debugging logs
			console.log('emitGetAllRooms');
			console.log(User.getCurrentId());
			// console.log('rooms');
			// console.log(rooms);
		}
		
		LBSocket.emit('rooms:get', { user: User.getCurrentId() }, function(err, roomObjs) {
			DEBUG && console.log('rooms:get'); // Debugging log
			if (err) {
				console.error(err);
			} else {
				addRooms(roomObjs);
			}			
		});
	}

	/**
	 * @ngdoc method
	 * @name RoomService.removeAll
	 * @description Clear the local cached rooms.
	 */
	function removeAll() {
		DEBUG && console.log('removeAll');	// Debugging log
		rooms = {};
		DEBUG && console.log(rooms);	// Debugging log
	}

	/**
	 * @ngdoc method
	 * @name RoomService.searchMessage
	 * @description Full text searching in the room.
	 * @param {string} TODO:
	 * @returns TODO:
	 */
	function searchMessage() {		
	}

	/**
	 * @ngdoc method
	 * @name RoomService.getRoomTags
	 * @description Gets all tags about the messages in the given room.
	 * @param {string} roomId The id of room to get.
	 */
	function getRoomTags(roomId) {
  	LBSocket.emit('room:tags:get', {roomId: roomId}, function(err, tags) {
  		DEBUG && console.log('room:tags:get'); // Debugging log
  		if (err) {
  			console.error(err);
  		} else {
  			console.log(tags);
  		}
  	});
  }

  /**
	 * @ngdoc method
	 * @name RoomService.updateTags
	 * @description Updates all tags about the messages in the given room.
	 * @param {string} roomId The id of room to update.
	 * @param {object} tags Tags which need to update to the server.
	 */
  function updateTags(roomId, tags) {
		DEBUG && console.log('room:tags:update'); // Debugging log
		LBSocket.emit('room:tags:update', {roomId: roomId, tags: tags}, function(err, updatedTags) {
	    if (err) {
	      console.error(err);
	    } else {
	      console.log(updatedTags);
	    }
	  });
	}

	/**
	 * @ngdoc method
	 * @name RoomService.joinSelf
	 * @description Joins the self room of current user to listen to the new messages.
	 */
	function joinSelf() {
    DEBUG && console.log('joinSelf');	// Debugging log
    LBSocket.emit('self:join', User.getCurrentId());
	}


	/* Chatroom operations */

	/**
	 * @ngdoc method
	 * @name RoomService.setCurrentRoom
	 * @description Sets the current active (entering to chat) room.
	 * @param {string} roomId Current active (entering to chat) room id.
	 */
	function setCurrentRoom(roomId) {
		if (DEBUG) { // Debuggin logs
			console.log('setCurrentRoom');
			console.log(roomId);
		}

		_currentRoomId = roomId;
		_lastReadMessageId = null;
		_filterBy = {};
		if (roomId != -1) {
			joinRoom(roomId);
		}
	}

	/**
	 * @ngdoc method
	 * @name RoomService.getCurrentRoom
	 * @description Gets the current active (chatting) room.
	 * @returns {object} The room object which is currently active (chatting).
	 */
	function getCurrentRoom() {
		if (DEBUG) { // Debuggin logs
			console.log('getCurrentRoom');
			console.log(_currentRoomId);
		}
		return rooms[_currentRoomId];
	}

	/**
	 * @ngdoc method
	 * @name RoomService.getRoomMessages
	 * @description
	 * Initially getting the messages of given room id.
	 * This will emit the websocket event and broadcast to notify when
	 * all messages have bound to the room object.
	 * @param {string} roomId The room id to get the messages
	 */
  function getRoomMessages(roomId){
  	DEBUG && console.log('getRoomMessages'); // Debugging log
  	
  	var data = { roomId: roomId };
  	var lastReadMessageId = getLastReadMessageId();
  	if( lastReadMessageId ){
  		data.lastReadMessageId = lastReadMessageId
  	}
  	DEBUG && console.log(data); // Debugging log

  	LBSocket.emit('room:messages:get', data , function(err, messageObjs){
  		if (DEBUG) {	// Debugging logs
  			console.log('room:messages:get');
		    // console.log(messages);
		    console.log(messageObjs.length);
  		}

  		// Binding messages to the room object
	    for (var i = 0; i < messageObjs.length; i++) {
	    	addMessage(messageObjs[i]);
	    }
			emitUpdateRoomLastReadMessage(_.last(messageObjs));
			// Not sure if still need...
	    // if (!messageObjs.length) {
				// groupMessagesByDate(getRoom(roomId));
	    // }

	    // Broadcast to notify messages completed loaded.
	    $rootScope.$broadcast('roomMessagesGot');
	  });
  }

  function isPrivate(room) {
  	return (room.type && room.type === 'private');
  }

  function isGroup(room) {
  	return room.type === 'group';
  }

  //TODO: performance?
  /**
	 * @ngdoc method
	 * @name RoomService.addMessage
	 * @description
	 * Adds a message recieved from remote server or
	 * asynchronously appended with files from local to the room object.
	 * And broadcast to notify to update views.
	 * @param {object} message The message object to add.
	 */
  function addMessage(message) {
  	DEBUG && console.log('addMessage'); // Debugging log
		var room = getRoom(message.roomId);
		if (!message.id) {
			if (DEBUG) {	// Debugging logs
				console.log('local adding');
				console.log(message);
			}

			message.id = message.timestamp; // For removing from view after updating from server.
			room.messages[message.timestamp] = message;
		} 
		else {
			room.messages[message.id] = message;
		}
		groupMessagesByDate(room);
		
		$rootScope.$broadcast('onNewMessage', { msg: message });
  }

  /**
	 * @ngdoc method
	 * @name RoomService.emitCreateMessage
	 * @description
	 * Create a message to remote server through websocket.
	 * @param {object} newMessage The message object to create.
	 */
  function emitCreateMessage(newMessage){
		DEBUG && console.log('emit room:messages:new')
		LBSocket.emit('room:messages:new', newMessage);
	}

	/**
	 * @ngdoc method
	 * @name RoomService.groupMessagesByDate
	 * @description
	 * Classifies messages into group by created date.
	 * @param {object} room The room object to arrange.
	 */
	function groupMessagesByDate(room) {
	  room.viewMessages = $filter('groupDiv')(room.messages, function(msg) {
	    return $filter('amChatGrouping')(msg.created);
	  });
    $NUChatTags.refreshTagList(room.viewMessages);
    room.tagList = $NUChatTags.getTagList();
  }

  function emitUpdateRoomLastReadMessage(message){
  	console.log('emitUpdateRoomLastReadMessage')//
  	console.log(message)//
  	
  	if(message){
	  		var data={};
		  	data.userId=User.getCachedCurrent().id;
		  	data.roomId=message.roomId
		  	data.messageId=message.id
		  	console.log(data);
  		LBSocket.emit('room:lastReadMessage:update', data , function(err, lastReadMessageId){
  			console.log('room:lastReadMessage:update');//
  			if(err){
  				console.log(err)
  			}
  			else{
  				console.log(lastReadMessageId)//
  			}
  		});	

  	}
  }

  /**
	 * @ngdoc method
	 * @name RoomService.filterByUser
	 * @description
	 * Filtering messages by given user id.
	 * @param {object} room The room object which contains messages to filter.
	 * @param {string} userId The user id to filter by.
	 */
  function filterByUser(room, userId) {
    _filterBy.ownerId = userId;
    filtering(room);
  }
  /**
	 * @ngdoc method
	 * @name RoomService.filterByDate
	 * @description
	 * Filtering messages by given date.
	 * @param {object} room The room object which contains messages to filter.
	 * @param {string} date The date(MM-dd EEE) to filter by.
	 */
  function filterByDate(room, date) {
    _filterBy.date = date;
    filtering(room);
  }
  /**
	 * @ngdoc method
	 * @name RoomService.getAllMessages
	 * @description
	 * Reset filters and get original messages of the room.
	 * @param {object} room The room object which contains the messages.
	 */
  function getAllMessages(room) {
    _filterBy = {};
    filtering(room);
  }

  /**
	 * @ngdoc method
	 * @name RoomService.getUnreadMessagePosition
	 * @description
	 * Gets the start id of unread messages.
	 * @param {string} roomId The room id which contains the messages.
	 * @returns {Integer} The start index of unread messages, if none, returns 0.
	 */
  function getUnreadMessagePosition(roomId) {
		var unreadIndex = 0;
		_.find(getRoom(roomId).viewMessages, function(obj, idx) {
			if (obj.id === _lastReadMessageId) {
				unreadIndex = idx;
				return true;
			}
		});
		return unreadIndex;
	}

	/**
	 * @ngdoc method
	 * @name RoomService.getLastReadMessageId
	 * @description
	 * Gets the id of the last read message.
	 * @returns {string} The id of the last read message.
	 */
	function getLastReadMessageId() {
		return _lastReadMessageId;
	}

	// //load rooms from pouchdb
	// function loadAllRooms(){
	// 	PouchService.getRooms().then(function(rows){
	// 		console.log(rows);
	// 		rows.forEach(function(row){
	// 			console.log(row);
	// 			addRoom(row.key);
	// 		})
	// 	})
	// }


	// Initializing
	joinSelf();

	// Public methods
	var service = {
		createGroupRoom: createGroupRoom,
		updateGroupRoom: updateGroupRoom,
		createPrivateRoom: createPrivateRoom,
		getRooms: getRooms,
		emitGetAllRooms: emitGetAllRooms,
		removeAll: removeAll,
		searchMessage: searchMessage,
		getRoomTags: getRoomTags,
		updateTags: updateTags,

		setCurrentRoom: setCurrentRoom,
		getCurrentRoom: getCurrentRoom,
		getRoomMessages: getRoomMessages,
		isPrivate: isPrivate,
		isGroup: isGroup,
		addMessage: addMessage,
		emitCreateMessage: emitCreateMessage,
		groupMessagesByDate: groupMessagesByDate,
		filterByUser: filterByUser,
		filterByDate: filterByDate,
		getAllMessages: getAllMessages,
		getUnreadMessagePosition: getUnreadMessagePosition,
		getLastReadMessageId: getLastReadMessageId,

		joinSelf: joinSelf,
	};

	return service;

}  