module.exports = function(app) {
	var _ = require('underscore');

  app.on('started', function() {
  	
	  app.sio.on('connection', function(socket){

	  	console.log('a user connected');

      console.log(socket.handshake)
      //var userData = socket.handshake.user || false;

      
	  	
	  	socket.on('chat message', function(msg){
	    	console.log('message: ' + msg);

	    	app.models.Message.create({text:msg}, function(err, obj){
	    		if(err){
	    			console.log('err='+err);
	    		}
	    		console.log('created='+JSON.stringify(obj));
	    	})

	    	app.sio.emit('chat message', msg);
	  	});


      //
      // UserList request
      //
      socket.on('friends:get', function (query) {
        console.log('friends:get')
        
        app.models.User.find(function(err,friends){
          console.log(friends)
          
          if(err){
            console.log(err)
          }
          _.each(friends, function(friend) {
            console.log(friend)
            socket.emit('friends:new', {
              id: friend.id,
              username: friend.username
            });
          });//_.each

        });//app.models.User.find
      })//socket.on


      //
      // Create Room
      //
      socket.on('rooms:create', function(room, fn) {
        console.log('rooms:create')
        console.log(room)
        app.models.room.create(room,function(err, obj){
          if(err){
            console.log(err)
            return;
          }
          socket.emit('rooms:new',obj);
        });//
        
      });//end socket.on('rooms:create')

	  	//
      // Roomlist request
      //
      socket.on('rooms:get', function (query) {
      	console.log('rooms:get')
      	
        app.models.room.find({},function(err,rooms){
      		if(err){
	      		console.log(err)
	      	}
	      	_.each(rooms, function(room) {
            console.log(room)
            socket.emit('rooms:new', room);
          });//_.each
      
      	});//app.models.room.find
      })//socket.on
      

      //
      // Join Room
      //
      socket.on('room:join', function(id, fn) {
        console.log(id)
        app.models.room.findById(id,function(err, room) {
          if (err) {
                // Oh shit
                console.log(err)
                return;
          }
          if (!room) {
              // No room bro
              return;
          }
          console.log(room)
          console.log("socket.join id="+id)
          socket.join(id);
          // Send back Room meta to client
          if (fn) {
              fn({
                  id: room._id,
                  name: room.name,
                  description: room.description
              });
          }

        });//app.models.room.findById
            
      });//socket.on

      


      //
      // New Message
      //
      socket.on('room:messages:new', function(data) {
        console.log(data)
        app.models.message.create(data,function(err, obj){
          if(err){
            console.log(err)
            return;
          }
          console.log(obj)
          /*
          var outgoingMessage = {
            id: obj._id,
            //owner: obj.owner,
            //avatar: hash.md5(userData.email),
            //name: userData.displayName,
            text: obj.text,
            posted: obj.posted,
            room: obj.room
          }
          */

          //console.log("obj.room="+obj.room)

          //console.log(app.sio.sockets.in(obj.roomId))
          app.sio.sockets.in(obj.roomId).emit('room:messages:new', obj);
          //console.log(outgoingMessage)
        });   
      });//end socket.on
      

	  	socket.on('disconnect', function(){
	  		console.log('user disconnected');
	  	});
	  });

  });
}