module.exports = function(app) {
	var _ = require('underscore');
  //var mongodb=require('loopback-connector-mongodb').mongodb
  var GridStore = require('mongodb').GridStore
  var ObjectID = require('mongodb').ObjectID

  app.on('started', function() {
  	
	  app.sio.on('connection', function(socket){

	  	console.log('a user connected');

      //console.log(socket.handshake)
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
      // join self room
      //
      socket.on('self:join', function (userId) {
        console.log('self:join')
        console.log(userId)
        socket.join(userId);
      });


      //
      // UserList request
      //
      socket.on('friends:get', function (query) {
        console.log('friends:get')
        //console.log(app.models.User)
        
        app.models.user.find(function(err,friends){
          console.log(friends)
          
          if(err){
            console.log(err)
          }
          _.each(friends, function(friend) {
            console.log(friend)
            console.log('friends:new')
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
      socket.on('rooms:get', function (data) {
      	console.log('rooms:get')
        console.log(data)

        var filter={
          "where": { 
            "or" : [
              {"ownerId":data.id},
              {"friend":data.id},
              {"type":"group"}
            ]
          }
        }

        console.log(filter)

        app.models.room.find(filter,function(err,rooms){
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
        console.log('room:join')
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
      // Join Room
      //
      socket.on('friend:join', function(data, fn) {
        // data.name='private room'
        // data.type='private'
        // data.ownerId=data.user
        // console.log(data)

        // app.models.room.find({ownerId:data.user},function(err,room){
        var filter={
          "where": { 
            "or" : [
              {"and": [{"ownerId":data.user},{"friend":data.friend}]},
              {"and": [{"ownerId":data.friend},{"friend":data.user}]}
            ]
          }
        }

        app.models.room.findOne(filter,function(err,room){ 
          if(err){
            console.log(err)
            return;
          }
          //console.log('room.length='+room.length)
          if (!room) {
            console.log('!room')
            app.models.user.findById(data.user,function(err, user) {
              if(err){
                console.log(err)
                return;
              }
              console.log(user)
              
              user.privateRooms.create({name:'private room',type:"private",friend:data.friend},function(err,newroom){
                if(err){
                  console.log(err)
                  return;
                }
                console.log(newroom)
                //join new created room
                socket.join(newroom.id);

                //notify self new room created
                console.log('rooms:new')
                socket.emit('rooms:new', newroom);//
                
                //notify friend new room created
                console.log('friends:new')
                app.sio.sockets.to(newroom.friend).emit('friends:new', {
                  id: user.id,
                  username: user.username
                });
                console.log('rooms:new')
                app.sio.sockets.to(newroom.friend).emit('rooms:new', newroom);
                // Send back Room meta to client
                if (fn) {
                    fn(newroom);
                }
              });

            })
          }
          else{
            console.log('!!room')
            console.log(room)
            socket.join(room.id);
            // Send back Room meta to client
            if (fn) {
                fn(room);
            }
          }
          

        })


        // app.models.user.findById(data.user,function(err, user) {
        //   if(err){
        //     console.log(err)
        //     return;
        //   }
        //   console.log(user)
        //   user.rooms.create(data,function(err,room){
        //     if(err){
        //       console.log(err)
        //       return;
        //     }
        //     console.log(room)
        //     socket.join(room.id);
        //   });

        // })
        
        // app.models.room.findById(id,function(err, room) {
        //   if (err) {
        //         // Oh shit
        //         console.log(err)
        //         return;
        //   }
        //   if (!room) {
        //       // No room bro
        //       return;
        //   }
        //   console.log(room)
        //   console.log("socket.join id="+id)
        //   socket.join(id);
        //   // Send back Room meta to client
        //   if (fn) {
        //       fn({
        //           id: room._id,
        //           name: room.name,
        //           description: room.description
        //       });
        //   }

        // });//app.models.room.findById
        // console.log('*app.models.user')
        // console.log(app.models.user)
        // console.log('*app.models.user')

        
        // app.models.Person.messages({}, function(err, room) {
        //   if(err){
        //     console.log(err)
        //   }
        //   console.log(room)
        // });



        // var privateRoom = app.models.user.rooms.build(data);
        // console.log(privateRoom)

        // app.models.user.room.create(data, function(err, room) {
        //   if(err){
        //     console.log(err)
        //   }
        //   else
        //   {
        //     console.log(room)
        //   }
  
        // });


            
      });//socket.on


      //
      // New Message
      //
      socket.on('room:messages:new', function(data) {
        console.log('room:messages:new')
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

      //
      // New File
      //
      socket.on('room:files:new', function(data) {
        console.log('room:files:new')
        //console.log(data)
        
        var db = app.datasources.db.connector.db;
        console.log(db)
        db.safe = {w: 1};

        //console.log(mongodb)
        var gridStore = new GridStore(db, data.filename, "w",{
          "content_type": data.type,
          "chunk_size": 1024*4
        });
        //var gridStore = new moGridStore(db, new ObjectID(), "test_gs_getc_file", "w");
        
        var buffer = new Buffer(data.file);

        gridStore.open(function(err, gridStore) {
          gridStore.write(buffer, function(err, gridStore) {
            gridStore.close(function(err, result) {
              if(err){
                console.log(err)
              }
              
              console.log(result)

              // Let's read the file using object Id
              // GridStore.read(db, result._id, function(err, data) {
              //   //test.equal('hello world!', data);
              //   if(err){
              //     console.log(err)
              //   }
                
              //   //console.log(data)
                
              // });

              var newMessage={}
              
              newMessage.roomId = data.roomId;
              newMessage.ownerId = data.ownerId; 
              newMessage.text = result._id
              newMessage.type = data.type
              console.log(newMessage)    

              app.models.message.create(newMessage,function(err, obj){
                if(err){
                  console.log(err)
                  return;
                }
                console.log('room:messages:new')
                console.log(obj)
                app.sio.sockets.in(obj.roomId).emit('room:messages:new', obj);
                
              });

            });
          });
        });


      });//end socket.on  
      

	  	socket.on('disconnect', function(){
	  		console.log('user disconnected');
	  	});
	  });

  });
}