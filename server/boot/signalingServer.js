module.exports = function(app) {
	var _ = require('lodash-node');
	var users = [];

	app.on('started', function() {

		app.sio.on('connection', function(socket){
			console.log('Signaling connection');

			socket.on('login', function (userId) {
				console.log('Signaling login');
				console.log(userId);
				console.log(socket.id);
				console.log(users);
				// if this socket is already connected,
				// send a failed login message
				if (_.findIndex(users, { socket: socket.id }) !== -1) {
					socket.emit('login_error', 'You are already connected.');
				}

				// if this name is already registered,
				// send a failed login message
				if (_.findIndex(users, { id: userId }) !== -1) {
					socket.emit('login_error', 'This name already exists.');
					return;
				}

				users.push({
					id: userId,
					socket: socket.id
				});
				console.log(users);
				socket.emit('login_successful', _.pluck(users, 'id'));

				// socket.broadcast.emit('online', name);
				socket.broadcast.emit('online', userId);

				// console.log(name + ' logged in');
				console.log(userId + ' logged in');

			});//socket.on login

			// socket.on('sendMessage', function (name, message) {
			// 	console.log('*Signaling sendMessage');
			// 	console.log('to:'+name)
			// 	var currentUser = _.find(users, { socket: socket.id });
			// 	console.log('currentUser')
			// 	console.log(currentUser)
			// 	if (!currentUser) { return; }

			// 	console.log('users')
			// 	console.log(users)
				
			// 	var contact = _.find(users, { name: name });
			// 	console.log('contact')
			// 	console.log(contact)
			// 	if (!contact) { return; }

			// 	app.sio
			// 	.to(contact.socket)
			// 	.emit('messageReceived', currentUser.name, message);

			// });//socket.on sendMessage

			socket.on('sendMessage', function (toUserId, message) {
				console.log('*Signaling sendMessage');
				console.log('toUserId=');//
				console.log(toUserId);//
				console.log('message=');//
				console.log(message);//

				var currentUser = _.find(users, { socket: socket.id });
				console.log('currentUser=');//
				console.log(currentUser);//
				if (!currentUser) { return; }

				console.log('users=');//
				console.log(users);//
				
				var toUser = _.find(users, { id: toUserId });
				console.log('toUser=');//
				console.log(toUser);//
				//TODO: if user is not online?
				if (!toUser) { return; }

				app.sio
				.to(toUser.socket)
				.emit('messageReceived', currentUser.id, message);

			});//socket.on sendMessage

			socket.on('disconnect', function () {
				console.log('Signaling disconnect');
				console.log(users);
				var index = _.findIndex(users, { socket: socket.id });
				// console.log(index)
				if (index !== -1) {
					console.log('Signaling emit offline');
					socket.broadcast.emit('offline', users[index].id);
					console.log(users[index].id + ' disconnected');
					users.splice(index, 1);
				}
				console.log(users);
			});//socket.on disconnect

		});//app.sio.on connection


	});//app.on

};