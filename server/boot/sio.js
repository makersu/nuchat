module.exports = function(app) {
  app.on('started', function() {
  	
	  app.sio.on('connection', function(socket){
	  	console.log('a user connected');
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
	  	socket.on('disconnect', function(){
	  		console.log('user disconnected');
	  	});
	  });

  });
}