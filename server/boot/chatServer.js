module.exports = function(app) {

	var _ = require('underscore');
  var fs = require('fs');
  var ffmpeg = require('fluent-ffmpeg');
  var gm = require('gm');
  var moment = require('moment')
  var md5 = require('MD5');
  var async =require('async');


  //var mongodb=require('loopback-connector-mongodb').mongodb
  var GridStore = require('mongodb').GridStore
  var ObjectID = require('mongodb').ObjectID

  app.on('started', function() {
  	
	  app.sio.on('connection', function(socket){

	  	console.log('*on chat connection');
      socket.emit('connection', 'connected');

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

      //
      // get friends
      //
      socket.on('friends:get', function (data, cb) {
        console.log('*on friends:get');//
        console.log(data);//
        
        app.models.user.findById(data.userId, function(err, user){
          if(err){
            console.log(err);
            cb(err);
            return;
          }
          else if(!user){
            console.log('!user');
            cb('!user');
            return;
          }

          console.log(user);

          if (user) {
            var filter={
              fields: {id: true, username: true, email:true, avatarThumbnail:true, avatarOriginal:true }, 
              "where": { 
                  id:{ inq: user.friends}
              }
            }
            console.log(JSON.stringify(filter));          

            app.models.user.find(filter,function(err, objs){
              if(err){
                console.log(err);
                cb(err);
              }
              console.log(objs);
              cb(null, objs);
            });//user.find
          }
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
      // socket.on('rooms:create', function(data, cb) {
      //   console.log('rooms:create')
      //   console.log(data)
      //   app.models.room.create(data ,function(err, obj){
      //     if(err){
      //       console.log(err)
      //       cb(err);
      //     }
      //     console.log(obj);
      //     // socket.emit('rooms:new',obj);
      //     obj.joiners.forEach(function(joiner){
      //       console.log('emit rooms:new')
      //       console.log(joiner)
      //       app.sio.sockets.to(joiner).emit('rooms:new', obj);
      //     })
          
      //     if(cb){
      //       cb(null, obj);
      //     }
      //   });//
        
      // });//end socket.on('rooms:create')

      //
      // Create Room
      //
      socket.on('rooms:group:create', function(data, cb) {
        console.log('*on rooms:group:create');
        console.log(data)

        app.models.user.findById(data.user,function(err, user) {
          if(err){
            console.log(err)
            cb(err);
            return;
          }
          
          delete data.user

          console.log(user)
          user.rooms.create(data ,function(err, roomObj){
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

            socket.join(roomObj.id);//???  
            cb(null, roomObj);
            
          });//end create room

        });//end find user  
        
      });//socket.on

      socket.on('rooms:group:update', function(data, cb) {
        console.log('*on rooms:group:update');
        console.log(data)

        if(!data.name){
          cb('err: !data.name');
          return;
        }

        app.models.room.findById(data.id, function(err, roomObj) {
          if(err){
            console.log(err)
            cb(err);
            return;
          }
          
          // console.log(roomObj);

          if(roomObj.id){
            app.models.room.updateAll({_id:roomObj.id}, data, function(err,info){
              if(err){
                console.log(err)
                cb(err)
              }
              console.log(info);

              //TODO: reselect and emit removed user?
              if(info.count && data.name){
                
                data.id=roomObj.id//TODO: updateAll will remove data.id?
                // console.log(data)

                //notify update
                data.joiners.forEach(function(joiner){
                  // console.log(joiner)
                  // app.sio.sockets.to(joiner).emit('rooms:group:update', data);
                  if(roomObj.joiners.indexOf(joiner) != -1){
                    console.log('emit rooms:group:update')
                    console.log(joiner);
                    app.sio.sockets.to(joiner).emit('rooms:group:update', data);
                  }
                  else{
                    console.log('emit rooms:new');
                    console.log(joiner);
                    app.sio.sockets.to(joiner).emit('rooms:new', data);
                  }
                })

                //notify remove
                roomObj.joiners.forEach(function(oldJoiner){
                  if(data.joiners.indexOf(oldJoiner)==-1){
                    console.log('emit rooms:group:remove')
                    console.log(oldJoiner);
                    app.sio.sockets.to(oldJoiner).emit('rooms:group:remove', data);
                  }
                })

              }//end if info.count
              
            });
          }
          else{
            console.log('!roomObj.id, room not found!');
          }

        });//end room.findById
        
      });//socket.on


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
              { "joiners": { in: [data.user]}},
              {"ownerId": data.user}
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

        app.models.room.findById(data.roomId, function(err, obj) {
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


      socket.on('rooms:private:create', function(data, cb) {
        console.log('*on rooms:private:create')
        console.log(data)

        //create self room?
        if(data.user==data.friend){
          console.log('data.user==data.friend')
          return;
        }

        // var filter={
        //   "where": { 
        //     "and" : [
        //       {"type": "private"},
        //       {inq: [data.user, data.friend]}
        //     ]
        //   }
        // }

        var filter={
          "where": {
            "and":[
              {"type": "private"},
              { "or": [
                {"joiners" : [ data.user, data.friend ]},
                {"joiners" : [ data.friend, data.user ]}
              ]}
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
              
              user.rooms.create(newPrivateRoom ,function(err, roomObj){
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
      // socket.on('room:info', function(data, cb) {
      //   console.log('*on room:info')
      //   console.log(data)
      //   var filter =  { "where":{
      //                     roomId: data.roomId
      //                   },
      //                   order: 'created DESC',
      //                   limit: 1,
      //                 }

      //   console.log(filter)
      //   var lastMessage={}
      //   app.models.message.find(filter,function(err, objs){
      //     if(err){
      //       console.log(err);
      //       cb(err);
      //     }
      //     // console.log(objs);
      //     if(objs[0]){
      //       lastMessage=objs[0];
      //       // console.log(lastMessage);
      //       // getUnreadMessageCount(data.roomId, data.userId);
      //       app.models.message.count({roomId: data.room}, function(err,count){
      //         // console.log(count)
      //         var roomInfo={"lastMessage": lastMessage, total: count}
      //         console.log(roomInfo)
      //         cb(null, roomInfo)
      //       }); 
      //     }
      //     else{
      //       //no room message yet
      //       cb(null, {"lastMessage": null, total: 0})
      //     }
          
      //   });

      // });

      //
      // Get room latest message
      //
      socket.on('room:messages:latest', function(data, cb) {
        console.log('*on room:messages:latest')
        console.log(data)
        var filter =  { "where":{
                          roomId: data.roomId
                        },
                        order: 'created DESC',
                        // limit: 1,
                      }

        console.log(filter)

        app.models.message.findOne(filter,function(err, obj){
          if(err){
            console.log(err);
            cb(err);
          }
          else{
            if(obj){
              console.log(obj);//
              cb(null, obj);
            }
            else{
              //no message
              cb(null, undefined)
            }
          }  
        });

      });


      // socket.on('room:messages:unreadCount', function(data, cb) {
      //   console.log('*on room:messages:unreadCount')

      //   var existedFilter =  { "where":{
      //                     roomId: data.roomId,
      //                     userId: data.userId,
      //                   },
      //                 }

      //   console.log(JSON.stringify(existedFilter))

      //   app.models.lastReadMessage.findOne(existedFilter, function(err, existedObj){

      //     // console.log(existedObj);
          
      //     var lastReadMessageId;
          
      //     if(existedObj){
      //       // console.log(existedObj);
      //       lastReadMessageId = existedObj.messageId
      //     }

      //     console.log(lastReadMessageId);

      //     var countFilter = {
      //       roomId: data.roomId
      //     }

      //     if(lastReadMessageId){
      //       countFilter.id={ gt: lastReadMessageId }
      //     }
          
      //     console.log(JSON.stringify(countFilter))

      //     app.models.message.count(countFilter, function(err, count){
      //       if(err){
      //         console.log(err);
      //         cb(undefined);
      //         return;
      //       }
      //       else{
      //         console.log(count)
      //         cb(null, count);
      //       }
      //     });          
           
      //   });

      // });//end socket.on

      socket.on('room:lastReadMessage:get', function(data, cb) {
        console.log('*on room:lastReadMessage:get')
        console.log(data);
        var lastReadMessageInfo={
          lastReadMessageId: undefined,
          unreadCount: undefined
        }
        var existedFilter =  { "where":{
                          roomId: data.roomId,
                          userId: data.userId,
                        },
                      }

        console.log(JSON.stringify(existedFilter))

        app.models.lastReadMessage.findOne(existedFilter, function(err, existedObj){

          if(existedObj){
            console.log(existedObj);//
            lastReadMessageInfo.lastReadMessageId = existedObj.messageId; 
          }

          var countFilter = {
            roomId: data.roomId
          }

          if(lastReadMessageInfo.lastReadMessageId){
            countFilter.id={ gt: lastReadMessageInfo.lastReadMessageId }
          }
          
          console.log(JSON.stringify(countFilter))

          app.models.message.count(countFilter, function(err, count){
            if(err){
              console.log(err);
              cb(err);
              return;
            }
            else{
              console.log(count);//
              lastReadMessageInfo.unreadCount = count;
              console.log(lastReadMessageInfo)
              cb(null, lastReadMessageInfo);
            }
          });          
           
        });

      });//end socket.on


      //
      // Get Messages
      //
      socket.on('room:messages:get', function(data,cb) {
        console.log('*on room:messages:get')
        console.log(data)

        var filter =  { "where":{ 
                          roomId: data.roomId
                        },
                        order: 'created DESC',
                        limit: 300,
                      }

        console.log(JSON.stringify(filter))

        //TODO: db.collection.find().skip()?
        app.models.message.find(filter,function(err, objs){
          console.log(objs.length)
          if(err){
            cb(err);
          }
          else{
            cb(null, _(objs).reverse());
          }
        });//end app.models.message.find

      });//end socket.on

      socket.on('room:messages:history', function(data,cb) {
        console.log('*on room:messages:history')
        console.log(data)

        var filter =  { "where":{ 
                          roomId: data.roomId,
                          id: { lt: data.messageId }
                        },
                        order: 'created DESC',
                        limit: 300,
                      }

        console.log(JSON.stringify(filter))

        app.models.message.find(filter,function(err, objs){
          console.log(objs.length)
          if(err){
            cb(err);
          }
          else{
            cb(null, _(objs).reverse());
          }          
        });//end app.models.message.find

      });//end socket.on

      socket.on('room:lastReadMessage:update', function(data,cb) {
        console.log('*on room:lastReadMessage:update');
        console.log(data)

        var existedFilter =  { "where":{
                          roomId: data.roomId,
                          userId: data.userId,
                        },
                      }

        console.log(JSON.stringify(existedFilter))

        app.models.lastReadMessage.findOne(existedFilter, function(err, existedObj){
          console.log(existedObj);
          if(existedObj){
               var filter =  { "where":{
                          roomId: data.roomId,
                          userId: data.userId,
                          messageId: { lt:data.messageId }
                        },
                      }

                console.log(JSON.stringify(filter))

                app.models.lastReadMessage.findOne(filter,function(err, obj){
                  console.log(obj);//
                  if( obj ){  //if find older messageId then update to last read messageId
                    obj.messageId=data.messageId
                    app.models.lastReadMessage.upsert(obj,function(err, updatedObj){
                      if(err){
                        console.log(err)//
                        cb(err);
                        return;
                      }
                      console.log(updatedObj)//
                      cb(null, updatedObj.messageId);
                    });

                  }
                  else{ //not found older messageId
                    cb(null, data.messageId)//TODO
                  }
                  
                });

          }
          else{
            console.log('!existedObj then create')//

            app.models.lastReadMessage.create(data, function(err,obj){
              if(err){
                console.log(err);
                cb(err);
                return;  
              }
              else{
                console.log(obj)
                cb(null, obj);
              }
            });
          }
        });

      });//end

      // socket.on('room:lastReadMessage:update', function(data,cb) {
      //   console.log('*on room:lastReadMessage:update');
      //   console.log(data)

      //   var filter =  { "where":{
      //                     roomId: data.roomId,
      //                     userId: data.userId,
      //                     messageId: { lt:data.messageId }
      //                   },
      //                 }

      //   console.log(JSON.stringify(filter))

      //   app.models.lastReadMessage.findOne(filter,function(err,obj){
      //     console.log(obj)//

      //     if( obj ){
      //       console.log('obj.id')
      //       data.id=obj.id;
      //       app.models.lastReadMessage.upsert(data,function(err,obj){
      //         if(err){
      //           console.log(err)//
      //           cb(err);
      //           return;
      //         }
      //         console.log(obj)//
      //         cb(null,obj);
      //       });

      //     }
      //     else{
      //       var existedFilter =  { "where":{
      //                     roomId: data.roomId,
      //                     userId: data.userId,
      //                   },
      //                 }

      //       console.log(JSON.stringify(existedFilter))

      //       app.models.lastReadMessage.findOne(existedFilter,function(err,existedObj){
      //         if(!existedObj){

      //         }
      //         else{

      //         }
      //       });  

      //     }//end else
          
      //   });


      //   // app.models.lastReadMessage.upsert(data,function(err,obj){
      //   //   if(err){
      //   //     console.log(err)//
      //   //     cb(err);
      //   //     return;
      //   //   }
      //   //   console.log(obj)//
      //   //   cb(null,obj);
      //   // });
        

      // });
       
      // socket.on('room:lastReadMessage:get', function(data,cb) {
      //   console.log('*on room:lastReadMessage:get');
      //   console.log(data)
      //   //var today=new Date()
      //   //data.since = data.since || new Date(today).setDate(today.getDate() - 7);
      //   // var filter =  { "where":{
      //   //                   roomId: data.roomId,
      //   //                   created: {gt: data.since }
      //   //                 } 
      //   //               }
      //   //data.messageId = data.messageId || 0 ;
      //   var filter =  { "where":{
      //                     roomId: data.roomId
      //                   },
      //                   order: 'created ASC',
      //                   //limit: 10,
      //                 }
        
      //   if(data.lastMessageId){
      //     filter.where.id={ gt:data.lastMessageId }
      //   }

      //   console.log(JSON.stringify(filter))

      //   app.models.message.find(filter,function(err,objs){
      //     console.log(objs.length)
      //     if(cb){
      //       //fn(objs)//
      //       cb(objs)
      //     }
          
      //   });


      // });

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

      // //
      // // update tags of message
      // //
      // socket.on('room:message:tags', function(data, cb) {
      //   console.log('room:message:tags');
      //   console.log(data);
      //   // cb(data);
      //   app.models.message.findById(data.id,function(err, existedObj){          
      //     if(existedObj){
      //       existedObj.tags=data.tags;

      //       // console.log(existedObj);
      //       app.models.message.upsert(existedObj,function(err, updatedObj){ //upsert if not master?
      //         if(err){
      //           console.log(err);
      //           cb(err);
      //         }
      //         cb(updatedObj);
      //         // app.sio.sockets.in(obj.roomId).emit('room:messages:new', data); //???
      //       });
      //     }
      //     else{
      //       console.log('room:message:tags not existed!');
      //       cb('room:message:tags not existed!');
      //     }  

      //   });
        
      // });//end socket.on

      //
      // update tags of message
      //
      socket.on('room:message:tags', function(data, cb) {
        console.log('*on room:message:tags');
        console.log(data);
        // console.log(JSON.stringify(cb));

        async.parallel([
            function(){ //update tags of message
              app.models.message.findById(data.id,function(err, obj){
                if(obj){
                  obj.tags=data.tags;
                  app.models.message.upsert(obj, function(err, updatedObj){ //upsert if not master?
                    if(err){
                      console.log(err);
                      cb(err);
                    }
                    cb(null, updatedObj.tags);
                    // app.sio.sockets.in(obj.roomId).emit('room:messages:new', data); //???
                  });
                }
                else{
                  console.log('message does not exist!');
                  cb('message does not exist!');
                }  

              });//end app.models.message.findById
            },
            function(){ //add tags to room
              app.models.room.findById(data.roomId,function(err, obj){
                if(obj){
                  // console.log(obj);
                  if(obj.tags){
                    _.each(data.tags,function(tag){
                      obj.tags.push(tag);
                    })
                  }
                  else{
                    obj.tags=data.tags;
                  }
                  
                  // console.log(obj);
                  app.models.room.upsert(obj, function(err, updatedObj){ //upsert if not master?
                    if(err){
                      console.log(err);  
                    }
                    else{
                      console.log(updatedObj);
                    }
                  });
                }
                else{
                  console.log('room does not exist!');
                }
              });//end app.models.room.findById
            }
        ],
        //async.series callback
        function(err, results){
            console.log("async callback")
            if(err){
              console.log(err);
            }
            else{
              console.log(results);
            }
        });
        
        
      });//end socket.on

      //get tags of room
      socket.on('room:tags:get', function(data, cb) {
        console.log('*on room:tags:get');
        app.models.room.findById(data.roomId,function(err, obj){          
          if(obj){
            cb(null, obj.tags);
          }
          else{
            console.log('room:tags:get not existed!');
            cb('room:tags:get not existed!'); //TODO return message?
          }  
        })
      });

      //update tags of room
      socket.on('room:tags:update', function(data, cb) {
        console.log('*on room:tags:update');
        app.models.room.findById(data.roomId,function(err, obj){
          if(obj){
            obj.tags=data.tags;
            app.models.room.upsert(obj, function(err, updatedObj){ //upsert if not master?
              if(err){
                console.log(err);  
              }
              else{
                console.log(updatedObj);
              }
            });//end app.models.room.upsert
          }
          else{
            console.log('room:tags:get not existed!');
            cb('room:tags:get not existed!');
          }  
        })
      });

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
        console.log(newMessage);//
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
          app.sio.sockets.in(obj.roomId).emit('room:messages:new', data); 

          // app.models.message.count({roomId: obj.roomId},function(err,count){
          //   console.log(count)
          //   data.total=count
          //   // console.log(data.message.timestamp)
          //   console.log(data)
          //   console.log('emit room:messages:new')
          //   app.sio.sockets.in(obj.roomId).emit('room:messages:new', data); 
          // }); 
          
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
        console.log('createRoomVideoMessage');
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

      // var getRoomTags = function(data, cb){
      //   app.models.room.findById(data.roomId,function(err, existedObj){          
      //     if(existedObj){
      //       cb(null, existedObj.tags);
      //     }
      //     else{
      //       console.log('room:tags:get not existed!');
      //       cb('room:tags:get not existed!');
      //     }  
      //   })
      // }

	  	socket.on('disconnect', function(){
	  		console.log('*chat disconnect');
        // console.log(socket);
	  	});
	  });

  });
}
