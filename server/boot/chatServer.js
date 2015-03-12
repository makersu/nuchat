module.exports = function(app) {

	var _ = require('underscore');
  var fs = require('fs');
  var ffmpeg = require('fluent-ffmpeg');
  var gm = require('gm');
  var moment = require('moment')

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
      // Join Room With Friend
      //
      socket.on('friend:join', function(data, fn) {
        console.log('friend:join')
        console.log(data)

        var filter={
          "where": { 
            "or" : [
              {"and": [{"ownerId":data.user},{"friend":data.friend}]},
              {"and": [{"ownerId":data.friend},{"friend":data.user}]}
            ]
          }
        }

        //TODO
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
          
          app.sio.sockets.in(obj.roomId).emit('room:messages:new', obj);
          
        });   
      });//end socket.on

      //
      // New File
      //
      socket.on('room:files:new', function(data) {
        console.log('room:files:new')
        console.log(data.filename)

        //var savePath = '/tmp/arrow.301.hdtv-lol.mp4'
        //var savePath = '/tmp/'+data.filename

        // fs.writeFile(savePath, data.file, function(err) {
        //   if(err){
        //     console.log(err)
        //   }
        //   console.log(data.type)
          //var thumbnailFilename = Math.random().toString(36).substring(7)+'.png';
          //var thumbnailFilePath = '/tmp/'+thumbnailFilename

          if(data.type.indexOf('image')!=-1){
            createRoomImageMessage(data)

          }
          else if(data.type.indexOf('video')!=-1){
            createRoomVideoMessage(data)
            // var proc = ffmpeg(savePath)
            // .on('filenames', function(filenames) {
            //   console.log('Will generate ' + filenames.join(', '))
            // })
            // .on('end', function() {
            //   console.log('Screenshots taken');
            //   writeFileWithThumbnailToGridStore(data,thumbnailFilePath,function(err,thumbnailFileId){
            //     if(err){
            //       console.log(err)
            //       return
            //     }
            //     var newMessage={}
            //     newMessage.roomId = data.roomId;
            //     newMessage.ownerId = data.ownerId; 
            //     newMessage.text = thumbnailFileId
            //     newMessage.type = data.type
            //     console.log(newMessage)

            //     createRoomMessage(newMessage)

            //   })

            // })
            // .on('error', function(err) {
            //   console.log('an error happened: ' + err.message);
            // })
            // .screenshots({
            //   timestamps: ['00:00:01.500'],
            //   filename: thumbnailFilename,
            //   folder: '/tmp',
            //   size: '50%'
            // });

          }
          else if(data.type.indexOf('audio')!=-1){
            createRoomAudioMessage(data)  
          }  



        //});//fs.writeFile
        
        // var db = app.datasources.db.connector.db;
        // //console.log(db)
        // db.safe = {w: 1};//

        // var gridStore = new GridStore(db, data.filename, "w",{
        //   "content_type": data.type,
        //   "chunk_size": 1024*4
        // });
        
        // var buffer = new Buffer(data.file);

        // gridStore.open(function(err, gridStore) {
        //   gridStore.write(buffer, function(err, gridStore) {
        //     gridStore.close(function(err, result) {
        //       if(err){
        //         console.log(err)
        //         return;
        //       }
              
        //       console.log(result)

        //       var newMessage={}
              
        //       newMessage.roomId = data.roomId;
        //       newMessage.ownerId = data.ownerId; 
        //       newMessage.text = result._id//
        //       newMessage.type = data.type
        //       console.log(newMessage)    

        //       app.models.message.create(newMessage,function(err, obj){
        //         if(err){
        //           console.log(err)
        //           return;
        //         }
        //         console.log('room:messages:new')
        //         console.log(obj)
        //         app.sio.sockets.in(obj.roomId).emit('room:messages:new', obj);  
        //       });

        //     });
        //   });
        // });


      });//end socket.on

      var writeFileToGridStore = function(data,cb){
        var db = app.datasources.db.connector.db;
        //console.log(db)
        db.safe = {w: 1};//

        var gridStore = new GridStore(db, data.filename, "w",{
          "content_type": data.type
        });
        
        var buffer = new Buffer(data.file);

        gridStore.open(function(err, gridStore) {
          gridStore.write(buffer, function(err, gridStore) {
            gridStore.close(function(err, result) {
              if(err){
                console.log(err)
                cb(err)
              }
              console.log(result)
              cb(err,result._id)
            });//close
          });//write
        });//open      

      }  

      var writeFileWithThumbnailToGridStore = function(data,thumbnailFilePath,cb){

        var db = app.datasources.db.connector.db;
        //console.log(db)
        db.safe = {w: 1};//

        //TODO
        var options={
          "content_type": data.type
        }
        if(data.type.indexOf('video')!=-1){
          options.chunk_size = 1024*512
        }

        console.log(thumbnailFilePath)
        //for thumbnail file
        var gridStore = new GridStore(db, null, "w", {"content_type": "image/png"});
        gridStore.open(function(err, gridStore) {
          gridStore.writeFile(thumbnailFilePath, function(err, gridStore) {
            gridStore.close(function(err, result) {
              if(err){
                console.log(err)
                cb(err)
              }
              console.log(result)
              var thumbnailFileId = result._id
              
              //for orginal file
              //TODO: meta thumbnail?
              gridStore = new GridStore(db, data.filename, "w",options);
              gridStore.open(function(err, gridStore) {
                gridStore.write(new Buffer(data.file), function(err, gridStore) {
                  gridStore.close(function(err, result) {
                    if(err){
                      console.log(err)
                      cb(err)
                    }
                    console.log(result)
                    cb(null, result._id, thumbnailFileId)
                  });//close
                });//write    
              });//open
            });//close
          });//writeFile
        });//open

      };//writeFileWithThumbnailToGridStore

      var createRoomMessage = function(newMessage){
        app.models.message.create(newMessage,function(err, obj){
          if(err){
            console.log(err)
            return;
          }
          console.log('room:messages:new')
          console.log(obj)
          app.sio.sockets.in(obj.roomId).emit('room:messages:new', obj); 
        });
      };//createRoomMessage

      var createRoomImageMessage = function(data){

        console.log(data.type)

        var thumbnailFilename = Math.random().toString(36).substring(7)+'.png';
        var thumbnailFilePath = '/tmp/'+thumbnailFilename//TODO

        var start=moment()//
        gm(data.file)
        .options({imageMagick: true})
        .resize(160, 160)
        //.quality(90) //
        .noProfile() //
        .write(thumbnailFilePath, function (err) {
          var end1=moment()//
          console.log("gm.resize moment end1.diff(start)="+end1.diff(start))//

          if(err){
            console.log(err)
          }
          
          end1=moment()//
          writeFileWithThumbnailToGridStore(data,thumbnailFilePath,function(err,originalFileId, thumbnailFileId){
            if(err){
              console.log(err)
              return
            }
            var end2=moment()
            console.log("image writeFileWithThumbnailToGridStore moment end2.diff(end1)="+end2.diff(end1))

            var newMessage={}
            newMessage.roomId = data.roomId;
            newMessage.ownerId = data.ownerId; 
            newMessage.originalFileId = originalFileId
            newMessage.thumbnailFileId = thumbnailFileId
            newMessage.type = data.type
            console.log(newMessage)

            createRoomMessage(newMessage)

          })//end writeFileWithThumbnailToGridStore

        });

      };//createRoomImageMessage



      var createRoomVideoMessage = function(data){
        var savePath = '/tmp/'+data.filename

        var start=moment()//
        fs.writeFile(savePath, data.file, function(err) {
          var end1=moment()//
          console.log("fs.writeFile moment end1.diff(start)="+end1.diff(start))//

          if(err){
            console.log(err)
            return
          }
          console.log(data.type)

          var thumbnailFilename = Math.random().toString(36).substring(7)+'.png';
          var thumbnailFilePath = '/tmp/'+thumbnailFilename//

          end1=moment()//
          var proc = ffmpeg(savePath)
            .on('filenames', function(filenames) {
              console.log('Will generate ' + filenames.join(', '))
            })
            .on('end', function() {
              var end2=moment()//
              console.log("ffmpeg moment end2.diff(end1)="+end2.diff(end1))//

              console.log('Screenshots taken');
              end2=moment()//
              writeFileWithThumbnailToGridStore(data,thumbnailFilePath,function(err, originalFileId, thumbnailFileId){
                var end3=moment()//
                console.log("video writeFileWithThumbnailToGridStore moment end3.diff(end2)="+end3.diff(end2))//
                if(err){
                  console.log(err)
                  return
                }
                var newMessage={}
                newMessage.roomId = data.roomId;
                newMessage.ownerId = data.ownerId; 
                newMessage.originalFileId = originalFileId
                newMessage.thumbnailFileId = thumbnailFileId
                newMessage.type = data.type
                console.log(newMessage)

                createRoomMessage(newMessage)

              })

            })
            .on('error', function(err) {
              console.log('an error happened: ' + err.message);
            })
            .screenshots({
              timestamps: ['00:00:01.001'],
              filename: thumbnailFilename,
              folder: '/tmp',
              size: '50%'
            });//proc

        });//fs.writeFile  

      };//createRoomVideoMessage
      
      var createRoomAudioMessage = function(data){
        writeFileToGridStore(data,function(err,originalFileId){
          if(err){
            console.log(err)
            return
          }
          var newMessage={}
          newMessage.roomId = data.roomId;
          newMessage.ownerId = data.ownerId; 
          newMessage.originalFileId = originalFileId
          newMessage.type = data.type
          console.log(newMessage)

          createRoomMessage(newMessage)

        });
       
      };//createRoomAudioMessage

	  	socket.on('disconnect', function(){
	  		console.log('user disconnected');
	  	});
	  });

  });
}