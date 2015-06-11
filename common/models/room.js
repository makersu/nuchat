module.exports = function(room) {

	room.observe('before save', function updateTimestamp(ctx, next) {
	  if (ctx.instance) {
	    // console.log('create');
	    ctx.instance.created = new Date();
	  }
	  next();
	});

};
