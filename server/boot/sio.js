module.exports = function(app) {
  app.on('started', function() {

	  app.sio.on('connection', function(socket){
	  	console.log('a user connected');
	  	socket.on('chat message', function(msg){
	    	console.log('message: ' + msg);
	    	app.sio.emit('chat message', msg);
	  	});
	  	socket.on('disconnect', function(){
	  		console.log('user disconnected');
	  	});
	  });

  });
}