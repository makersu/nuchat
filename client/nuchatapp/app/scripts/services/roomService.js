function RoomService(LBSocket) {
	console.log('RoomService')

	LBSocket.on('rooms:new', function(room) {
    console.log('rooms:new')
		console.log(angular.toJson(room))
    //$scope.availableRooms.push(room);//todo
    addRoom(room);
  });

  LBSocket.on('room:messages:new', function(message) {
    	console.log('room:messages:new')
    	console.log(message)
    	//$scope.room.messages.push(message)
      addMessage(message)

			//self.addMessage(message);

  });

	var rooms=[]
	//var rooms={}
	
	function getAll(){
		console.log('getAll')
		return rooms;
	}

	function get(roomId){
		console.log(roomId)
		for(var i=0; i< rooms.length;i++){
			console.log(rooms[i])
			console.log('room.id='+rooms[i].id)
			if(rooms[i].id==roomId){
				console.log('room.messages='+rooms[i].messages)
				if(!rooms[i].messages){
					rooms[i].messages=[];
				}
				return rooms[i];
			}
		}
	}

	function addRoom(room){
		console.log("addRoom="+room)
		for(var i=0; i< rooms.length;i++){
			if(rooms[i].id==room.id){
				return;
			}	
		}
		rooms.push(room);//todo
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
function addMessage(message){
	console.log(message)
	var room=get(message.roomId)
	console.log(room)
	room.messages.push(message);
}


	var service = {
		getAll: getAll,
		get: get,
		addRoom: addRoom,
		addMessage: addMessage
	};

	return service;

}  