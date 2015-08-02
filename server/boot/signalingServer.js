module.exports = function(app) {
	var _ = require('lodash-node');
	var users = [];
////
	var redis = require("redis");
  var redisClient = redis.createClient();
////
	app.on('started', function() {

		app.sio.on('connection', function(socket){
			console.log('*on signaling connection');

			socket.on('signalingLogin', function (userId) {
				console.log('*on signalingLogin');
				// console.log(userId);
				
				// if this socket is already connected,
				// send a failed login message
				// if (_.findIndex(users, { socket: socket.id }) !== -1) {
				// 	socket.emit('login_error', 'You are already connected.');
				// }

				// if this name is already registered,
				// send a failed login message
				// if (_.findIndex(users, { id: userId }) !== -1) {
				// 	socket.emit('login_error', 'This name already exists.');
				// 	return;
				// }

				// users.push({
				// 	id: userId,
				// 	socket: socket.id
				// });
				redisClient.hset("onlineUsers", userId, socket.id, redis.print);//

				// console.log(users);
				// socket.emit('login_successful', _.pluck(users, 'id'));
				redisClient.hkeys('onlineUsers', function(err, onlineUserIds){
					console.log('onlineUserIds');
					console.log(onlineUserIds);
					socket.emit('login_successful', onlineUserIds);
				});

				// socket.broadcast.emit('online', name);
				socket.broadcast.emit('online', userId);

				// console.log(name + ' logged in');
				console.log(userId + ' logged in');

			});//socket.on login

			socket.on('sendMessage', function (toUserId, message) {
				console.log('*Signaling sendMessage');
				console.log('toUserId=');//
				console.log(toUserId);//
				console.log(message);//

				// var currentUser = _.find(users, { socket: socket.id });
				// console.log('currentUser=');//
				// console.log(currentUser);//
				// if (!currentUser) { return; }

				// var toUser = _.find(users, { id: toUserId });
				// console.log('toUser=');//
				// console.log(toUser);//
				// //TODO: if user is not online?
				// if (!toUser) { return; }

				// app.sio
				// .to(toUser.socket)
				// .emit('messageReceived', currentUser.id, message);

				redisClient.hgetall('onlineUsers', function (err, onlineUsers) {
					if(err){
						console.log(err);
						return;
					}

					var toUserSocket = onlineUsers[toUserId];
					if(!toUserSocket){
						console.log('!toUserSocket');
						return;
					}
					console.log('toUserSocket');//
					console.log(toUserSocket);//

					var currentUserId;
					Object.keys(onlineUsers).forEach(function(key) {
						if(onlineUsers[key] === socket.id ){
							console.log(key);
							currentUserId=key;
							return;
						}
					});

					console.log('currentUserId');
					console.log(currentUserId);

					if(currentUserId){
						app.sio
						.to(toUserSocket)
						.emit('messageReceived', currentUserId, message);
					}
					
				});//end hgetall

				//emit user's self room?
				// app.sio
				// .to(toUserId)
				// .emit('messageReceived', currentUser.id, message);

			});//socket.on sendMessage

			socket.on('disconnect', function () {
				console.log('*signaling disconnect');
				
				// var index = _.findIndex(users, { socket: socket.id });
				// // console.log(index)
				// if (index !== -1) {
				// 	console.log('Signaling emit offline');
				// 	socket.broadcast.emit('offline', users[index].id);
				// 	console.log(users[index].id + ' disconnected');
				// 	users.splice(index, 1);
				// }

				var currentUserId;
				redisClient.hgetall('onlineUsers', function (err, onlineUsers) {
					if(err){
						console.log(err);
						return;
					}

					if(!onlineUsers){
						console.log('!onlineUsers');
						return;
					}
					
					Object.keys(onlineUsers).forEach(function(key) {
						if(onlineUsers[key] === socket.id ){
							console.log(key);
							currentUserId=key;
							return;
						}
					});

					if(currentUserId){
						console.log(currentUserId)
						socket.broadcast.emit('offline', currentUserId);
						redisClient.hdel("onlineUsers", currentUserId , redis.print);//?
					}
					
				});//end hgetall

			});//socket.on disconnect

		});//app.sio.on connection

	});//app.on

};