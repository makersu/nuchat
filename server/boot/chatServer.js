module.exports = function(app) {

	var _ = require('underscore');
  var fs = require('fs');
  var ffmpeg = require('fluent-ffmpeg');
  var gm = require('gm');
  var moment = require('moment')
  var md5 = require('MD5');

  //var mongodb=require('loopback-connector-mongodb').mongodb
  var GridStore = require('mongodb').GridStore
  var ObjectID = require('mongodb').ObjectID

  app.on('started', function() {
  	
	  app.sio.on('connection', function(socket){

	  	console.log('a user connected');
      socket.emit('connection', 'ready?');

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
        console.log('*on self:join');
        console.log(userId);
        socket.join(userId);
      });


      //
      // create profile letter avatar
      //
      socket.on('user:profile:letteravatar', function (data, cb) {
        console.log('user:profile:letteravatar')
        console.log(data)
        createLetterAvatar(data,cb)

      });

      //
      // update profile avatar
      //
      socket.on('user:profile:avatar', function (data, cb) {
        console.log('user:profile:avatar')
        console.log(data)
        updateAvatar(data,cb)

      });

      //
      // update profile
      //
      socket.on('user:profile', function (profile) {
        console.log('user:profile')
      });

      // //
      // // UserList request
      // //
      // socket.on('friends:get', function (query) {
      //   console.log('friends:get')
      //   //console.log(app.models.User)
        
      //   app.models.user.find(function(err,friends){
      //     console.log(friends)
          
      //     if(err){
      //       console.log(err)
      //     }
      //     _.each(friends, function(friend) {
      //       console.log(friend)
      //       console.log('friends:new')
      //       socket.emit('friends:new', {
      //         id: friend.id,
      //         username: friend.username,
      //         avatarThumbnail: friend.avatarThumbnail,
      //         avatarOriginal: friend.avatarOriginal
      //       });
      //     });//_.each

      //   });//app.models.User.find
      // })//socket.on

      //
      // get friends
      //
      socket.on('friends:get', function (data, cb) {
        console.log('*on friends:get')
        console.log(data)
        
        app.models.user.findById(data.user,function(err,user){
          if(err){
            console.log(err)
            cb(err)
          }
          console.log(user)

          var filter={
            fields: {id: true, username: true, email:true, avatarThumbnail:true, avatarOriginal:true }, 
            "where": { 
                id:{ inq: user.friends}
            }
          }
          console.log(JSON.stringify(filter))          

          app.models.user.find(filter,function(err, objs){
            if(err){
              console.log(err);
              cb(err);
            }
            console.log(objs);
            cb(null, objs);
          });//user.find
        });//user.findById
      })//socket.on

      //
      // find friend
      //
      socket.on('friends:find', function (data, cb) {
        console.log('friends:find')
        console.log(data)

        var filter={
          fields: {id: true, username: true},
          "where": { 
              "and":[{id:{neq:data.userId}}]            
          }
        }

        var orCondition = {"or":[]}
        orCondition.or.push({"email":{"like": data.searchText } })
        orCondition.or.push({"username":{"like": data.searchText } })

        filter.where.and.push(orCondition)

        console.log(JSON.stringify(filter));//

        app.models.user.find(filter,function(err,results){
          if(err){
            console.log(err)
            cb(err)
          }
          else{
            console.log(results)
            cb(null,results)
          }
          
        });//user.find 

      });//socket.on 

      // //
      // // add new friend
      // //
      // socket.on('friends:new', function (data) {
      //   console.log('friends:new')
      //   console.log(data)
      //   var start=moment()//
      //   app.models.user.findById(data.userId,function(err,user){
      //     console.log(user.friends)
      //     if(!user.friends){
      //       user.friends=[]
      //     }
      //     console.log(user.friends)

      //     for(var i=0;i<data.newFriends.length;i++){
      //       console.log(data.newFriends[i])
      //       if(user.friends.indexOf(data.newFriends[i])==-1){
      //         user.friends.push(data.newFriends[i])
      //       }
      //     }
      //     console.log(user.friends)
      //     user.save(function(err,obj){
      //       var end=moment()//
      //       console.log('end.diff(start)='+end.diff(start))
      //       if(err){
      //         console.log(err)
      //       }
      //       console.log(obj)


      //     });

      //   });//end findById

      // });//socket.on

      //
      // add new friend
      //
      socket.on('friends:new', function (data, cb) {
        console.log('on friends:new')
        console.log(data)
        app.models.user.findById(data.user,function(err,user){
          if(err)
          {
            console.log(err)
            cb(err)
          }
        	console.log(user.friends)//
        	if(!user.friends){
        		user.friends=[]
        	}
          var filter={
            fields: {id: true, username: true, email:true, avatarThumbnail:true }, 
            "where": {
              "and" : [
                {id: {inq:data.newFriends}},
                {id: {nin:user.friends}}
              ]
            }
          }
          console.log(JSON.stringify(filter))
          app.models.user.find(filter,function(err,users){
            if(err)
            {
              console.log(err)
              cb(err)
            }
        		console.log(users)//
        		if(!users){
        			console.log('!users');//
        			cb(null,[])
        		}
            for(var i=0;i<users.length;i++){
              user.friends.push(users[i].id)
            }
            console.log(user)
            user.save(function(err,obj){
              
              if(err){
                console.log(err)
                cb(err)
              }
              cb(null,users)
            });//user.save
          });//user.find
        });//user.findById
      });//socket.on


      //
      // Create Room
      //
      socket.on('rooms:create', function(data, cb) {
        console.log('rooms:create')
        console.log(data)
        app.models.room.create(data ,function(err, obj){
          if(err){
            console.log(err)
            cb(err);
          }
          console.log(obj);
          // socket.emit('rooms:new',obj);
          obj.joiners.forEach(function(joiner){
            console.log('emit rooms:new')
            console.log(joiner)
            app.sio.sockets.to(joiner).emit('rooms:new', obj);
          })
          
          if(cb){
            cb(null, obj);
          }
        });//
        
      });//end socket.on('rooms:create')

	  	//
      // Roomlist request
      //
      // socket.on('rooms:get', function (data) {
      // 	console.log('rooms:get')
      //   console.log(data)

      //   var filter={
      //     "where": { 
      //       "or" : [
      //         {"ownerId":data.id},
      //         {"friend":data.id},
      //         {"type":"group"}
      //       ]
      //     }
      //   }

      //   console.log(JSON.stringify(filter))

      //   app.models.room.find(filter,function(err,rooms){
      // 		if(err){
	     //  		console.log(err)
	     //  	}
	     //  	_.each(rooms, function(room) {
      //       console.log(room)
      //       socket.emit('rooms:new', room);
      //     });//_.each
      
      // 	});//app.models.room.find
      // })//socket.on

      socket.on('rooms:get', function(data, cb) {
        console.log('*on rooms:get')
        console.log(data)

        // var filter={
        //   "where": { 
        //     "or" : [
        //       {"ownerId":data.user},
        //       {"friend":data.user},
        //       {"joiners": {"inq": [data.user]}}
        //     ]
        //   }
        // }

        var filter={
          "where": { 
            "or": [
              { "joiners": { in: [data.user]}}
            ]
          }
        }

        console.log(JSON.stringify(filter))

        app.models.room.find(filter,function(err, objs){
          if(err){
            console.log(err)
            cb(err);
          }
          console.log(objs);
          cb(null, objs);
        });//app.models.room.find

      })//socket.on
      

      //
      // Join Room
      //
      socket.on('room:join', function(data, cb) {
        console.log('*on room:join');
        console.log(data);

        app.models.room.findById(data.room, function(err, obj) {
          if (err) {
            console.log(err);
            cb(err);
          }
          if (!obj) {
            cb("!obj");
            return;
          }

          console.log(obj);
     
          socket.join(obj.id);
          cb(null, obj);

        });//app.models.room.findById
            
      });//socket.on

      //
      // Join Room With Friend
      //
      // socket.on('friend:join', function(data, fn) {
      //   console.log('friend:join')
      //   console.log(data)

      //   //create self room?
      //   if(data.user==data.friend){
      //     console.log('data.user==data.friend')
      //     return;
      //   }

      //   var filter={
      //     "where": { 
      //       "or" : [
      //         {"and": [{"ownerId":data.user},{"friend":data.friend}]},
      //         {"and": [{"ownerId":data.friend},{"friend":data.user}]}
      //       ]
      //     }
      //   }

      //   //TODO
      //   app.models.room.findOne(filter,function(err,room){ 
      //     if(err){
      //       console.log(err)
      //       return;
      //     }
      //     //console.log('room.length='+room.length)
      //     if (!room) {
      //       console.log('!room')
      //       app.models.user.findById(data.user,function(err, user) {
      //         if(err){
      //           console.log(err)
      //           return;
      //         }
      //         console.log(user)
              
      //         user.privateRooms.create({name:'private room',type:"private",friend:data.friend},function(err,newroom){
      //           if(err){
      //             console.log(err)
      //             return;
      //           }
      //           console.log(newroom)
      //           //join new created room
      //           socket.join(newroom.id);

      //           //notify self new room created
      //           console.log('rooms:new')
      //           socket.emit('rooms:new', newroom);//
                
      //           //notify friend new room created
      //           console.log('emit friends:new')
      //           app.sio.sockets.to(newroom.friend).emit('friends:new', {
      //             id: user.id,
      //             username: user.username
      //           });
      //           console.log('rooms:new')
      //           app.sio.sockets.to(newroom.friend).emit('rooms:new', newroom);
      //           // Send back Room meta to client
      //           if (fn) {
      //               fn(newroom);
      //           }
      //         });

      //       })
      //     }
      //     else{
      //       console.log('!!room')
      //       console.log(room)
      //       socket.join(room.id);
      //       // Send back Room meta to client
      //       if (fn) {
      //           fn(room);
      //       }
      //     }
          

      //   })

            
      // });//socket.on


      socket.on('friend:join', function(data, cb) {
        console.log('*on friend:join')
        console.log(data)

        //create self room?
        if(data.user==data.friend){
          console.log('data.user==data.friend')
          return;
        }

        var filter={
          "where": { 
            "and" : [
              {"type": "private"},
              {inq: [data.user, data.friend]}
            ]
          }
        }

        console.log(JSON.stringify(filter))

        //TODO
        app.models.room.findOne(filter,function(err, existedRoom){ 
          if(err){
            console.log(err)
            cb(err);
          }

          if (!existedRoom) {
            console.log('!existedRoom')
            app.models.user.findById(data.user,function(err, user) {
              if(err){
                console.log(err)
                cb(err);
              }
              console.log(user)

              var newPrivateRoom = {
                name: "Private Room",
                type: "private",
                joiners: [data.user, data.friend]
              }
              
              user.privateRooms.create(newPrivateRoom ,function(err, roomObj){
                if(err){
                  console.log(err)
                  cb(err);
                }
                console.log(roomObj);
                roomObj.joiners.forEach(function(joiner){
                  console.log('emit rooms:new')
                  console.log(joiner)
                  app.sio.sockets.to(joiner).emit('rooms:new', roomObj);
                })

                //TODO: notify new friend?
                // console.log('emit friends:new')
                // app.sio.sockets.to(data.friend).emit('friends:new', {
                //   id: user.id,
                //   username: user.username
                // });

                socket.join(roomObj.id);//???  
                cb(null, roomObj);
                
              });//end create room

            });//end find user  
          }
          else{
            console.log('room existed');//
            console.log(existedRoom);
            socket.join(existedRoom.id);//???
            cb(null, existedRoom);
          }
          

        })

            
      });//socket.on


      //
      // Get room information(last message, total count)
      //
      socket.on('room:info', function(data, cb) {
        console.log('*on room:info')
        console.log(data)
        var filter =  { "where":{
                          roomId: data.room
                        },
                        order: 'created DESC',
                        limit: 1,
                      }

        console.log(filter)
        var lastMessage={}
        app.models.message.find(filter,function(err, objs){
          if(err){
            console.log(err);
            cb(err);
          }
          // console.log(objs);
          if(objs[0]){
            lastMessage=objs[0];
            // console.log(lastMessage);
            
            app.models.message.count({roomId: data.room}, function(err,count){
              // console.log(count)
              var roomInfo={"lastMessage": lastMessage, total: count}
              console.log(roomInfo)
              cb(null, roomInfo)
            }); 
          }
          else{
            //no room message yet
            cb(null, {"lastMessage": null, total: 0})
          }
          
        });

      });

      //
      // Get Messages
      //
      socket.on('room:messages:get', function(data,cb) {
        console.log('*on room:messages:get')
        console.log(data)
        //var today=new Date()
        //data.since = data.since || new Date(today).setDate(today.getDate() - 7);
        // var filter =  { "where":{
        //                   roomId: data.roomId,
        //                   created: {gt: data.since }
        //                 } 
        //               }
        //data.messageId = data.messageId || 0 ;
        var filter =  { "where":{
                          roomId: data.roomId
                        },
                        order: 'created ASC',
                        //limit: 10,
                      }
        
        if(data.lastMessageId){
          filter.where.id={ gt:data.lastMessageId }
        }

        console.log(JSON.stringify(filter))

        app.models.message.find(filter,function(err,objs){
          console.log(objs.length)
          if(cb){
            //fn(objs)//
            cb({"messages":objs})
          }
          
        });


      });
       


      //
      // New Message
      //
      socket.on('room:messages:new', function(data) {
        console.log('*on room:messages:new')
        console.log(data)
        // app.models.message.create(data,function(err, obj){
        //   if(err){
        //     console.log(err)
        //     return;
        //   }
        //   console.log(obj)
          
        //   app.sio.sockets.in(obj.roomId).emit('room:messages:new', obj);
          
        // });   
        createRoomMessage(data);
      });//end socket.on

      //
      // update tags of message
      //
      socket.on('room:message:tags', function(data, cb) {
        console.log('room:message:tags');
        console.log(data);
        // cb(data);
        app.models.message.findById(data.id,function(err, existedObj){          
          if(existedObj){
            existedObj.tags=data.tags;

            // console.log(existedObj);
            app.models.message.upsert(existedObj,function(err,updatedObj){ //upsert if not master?
              if(err){
                console.log(err);
                cb(err);
              }
              cb(updatedObj);
              // app.sio.sockets.in(obj.roomId).emit('room:messages:new', data); //???
            });
          }
          else{
            console.log('room:message:tags not existed!');
            cb('room:message:tags not existed!');
          }  

        });
        
      });//end socket.on

      //
      // New File
      //
      socket.on('room:files:new', function(data) {
        console.log('room:files:new')
        console.log(data)
        if(data.type.indexOf('image')!=-1){
          createRoomImageMessage(data)
        }
        else if(data.type.indexOf('video')!=-1){
          // createRoomVideoMessage(data)
        }
        else if(data.type.indexOf('audio')!=-1){
          createRoomAudioMessage(data)  
        }  

      });//end socket.on



      //
      var writeFromFileToGridStore = function(data,filePath,cb){
        console.log('writeFromFileToGridStore')
        console.log(filePath)

        var db = app.datasources.db.connector.db;
        db.safe = {w: 1};//

        //TODO
        var options={
          "content_type": data.content_type
        }

        if(options.content_type.indexOf('video')!=-1){
          options.chunk_size = 1024*1024
        }

        console.log(options)
        
        //for thumbnail file
        var gridStore = new GridStore(db, new ObjectID(), "w", options);
        gridStore.open(function(err, gridStore) {
          gridStore.writeFile(filePath, function(err, gridStore) {
            gridStore.close(function(err, result) {
              if(err){
                console.log(err)
                cb(err)
              }
              console.log(result)
              cb(null,result._id)
            
            });//close
          });//writeFile
        });//open

      };//writeFromFileToGridStore


      //
      var writeFileToGridStore = function(data,cb){
        var db = app.datasources.db.connector.db;
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

      //
      var writeFileWithThumbnailToGridStore = function(data,thumbnailFilePath,cb){
        var db = app.datasources.db.connector.db;
        db.safe = {w: 1};//

        //TODO
        var options={
          "content_type": data.type
        }

        if(data.type.indexOf('video')!=-1){
          options.chunk_size = 1024*1024
        }

        console.log(thumbnailFilePath)
        //for thumbnail file
        var gridStore = new GridStore(db, new ObjectID(), "w", {"content_type": "image/png"});
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
              gridStore = new GridStore(db, new ObjectID(), "w",options);
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

      //createRoomMessage
      var createRoomMessage = function(newMessage, returnTimestamp){
        console.log('createRoomMessage');
        app.models.message.create(newMessage,function(err, obj){
          if(err){
            console.log(err)
            return;
          }
          console.log(obj);
          
          var data={}
          data.message=obj
          if(returnTimestamp){
              data.message.timestamp=returnTimestamp;
          }
          app.models.message.count({roomId: obj.roomId},function(err,count){
            console.log(count)
            data.total=count
            // console.log(data.message.timestamp)
            console.log(data)
            console.log('emit room:messages:new')
            app.sio.sockets.in(obj.roomId).emit('room:messages:new', data); 
          }); 
          
        });
      };//createRoomMessage

      var createLetterAvatar = function(data, cb){
        console.log('createLetterAvatar')
        console.log(data)
        var color="#" + md5(data.email).substring(0, 6)
        console.log(color)
        var thumbnailFilename = Math.random().toString(36).substring(7)+'.png';
        var thumbnailFilePath = '/tmp/'+thumbnailFilename//TODO
        console.log(thumbnailFilePath)

        var firstLetter=data.username.toUpperCase().charAt(0)
        console.log('firstLetter='+firstLetter)
        
        gm(80,80, color)
        .options({imageMagick: true})
        .gravity('Center')
        .fontSize(50)
        .fill("#ffffff")
        .drawText(0,5,firstLetter)
        .write(thumbnailFilePath, function (err) {
          if(err){
            console.log(err)
            cb(err)
          }

          writeFromFileToGridStore({"content_type": "image/png"},thumbnailFilePath,function(err,gridFSFileId){
            if(err){
              console.log(err)
              cb(err)
            }

            var profile={}
            profile.id=data.id//refactoring?data.userId?
            profile.avatarThumbnail=gridFSFileId
            profile.avatarLetter=gridFSFileId//need?
            updateUserProfile(profile,cb)//

          })//end writeFileToGridStore

        });//end wtire
      }


      //updateAvatar
      var updateAvatar = function(data,cb){

        console.log(data.type)

        var thumbnailFilename = Math.random().toString(36).substring(7)+'.png';
        var thumbnailFilePath = '/tmp/'+thumbnailFilename//TODO

        var start=moment()//
        gm(data.file)
        .options({imageMagick: true})
        .resize(80, 80)
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

            var profile={}
            profile.id=data.userId
            profile.avatarThumbnail=thumbnailFileId
            profile.avatarOriginal=originalFileId
            //cb(profile)//
            updateUserProfile(profile,cb)//

          })//end writeFileWithThumbnailToGridStore
        });//end write
      };//end updateAvatar

      var updateUserProfile =function(profile,cb){
        console.log('updateUserProfile')
        console.log(profile)
        if(profile.id){
          app.models.user.updateAll({id:profile.id},profile, function(err,obj){
            if(err){
              console.log(err)
            }
            console.log(obj)
            if(obj){
              cb(err, profile);//
            }
          });
        }
        

      }

      //createRoomImageMessage
      var createRoomImageMessage = function(data){

        console.log(data.type)
        console.log(data.timestamp)
        
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

            createRoomMessage(newMessage,data.timestamp)

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
                console.log(newMessage);

                createRoomMessage(newMessage, data.timestamp)

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
          console.log(newMessage);

          createRoomMessage(newMessage, data.timestamp)

        });
       
      };//createRoomAudioMessage

	  	socket.on('disconnect', function(){
	  		console.log('*user disconnected');
	  	});
	  });

  });
}
