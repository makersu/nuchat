module.exports = function(app) {
	var _ = require('lodash-node');
	var users = [];

	app.on('started', function() {

		app.sio.on('connection', function(socket){
			console.log('Signaling connection');

			socket.on('login', function (name) {
				console.log('Signaling login');
				console.log(socket.id);
				console.log(users);
				// if this socket is already connected,
				// send a failed login message
				if (_.findIndex(users, { socket: socket.id }) !== -1) {
					socket.emit('login_error', 'You are already connected.');
				}

				// if this name is already registered,
				// send a failed login message
				if (_.findIndex(users, { name: name }) !== -1) {
					socket.emit('login_error', 'This name already exists.');
					return;
				}

				users.push({
					name: name,
					socket: socket.id
				});
				console.log(users);
				socket.emit('login_successful', _.pluck(users, 'name'));
				socket.broadcast.emit('online', name);

				console.log(name + ' logged in');
			});//socket.on login

			socket.on('sendMessage', function (name, message) {
				console.log('Signaling sendMessage');
				var currentUser = _.find(users, { socket: socket.id });
				if (!currentUser) { return; }

				var contact = _.find(users, { name: name });
				if (!contact) { return; }

				app.sio
				.to(contact.socket)
				.emit('messageReceived', currentUser.name, message);

			});//socket.on sendMessage

			socket.on('disconnect', function () {
				console.log('Signaling disconnect');
				var index = _.findIndex(users, { socket: socket.id });
				if (index !== -1) {
					socket.broadcast.emit('offline', users[index].name);
					console.log(users[index].name + ' disconnected');
					users.splice(index, 1);
				}
				console.log(users)
			});//socket.on disconnect

		});//app.sio.on connection


	});//app.on

};