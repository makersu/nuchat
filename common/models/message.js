module.exports = function(message) {

	message.observe('before save', function createdTimestamp(ctx, next) {
	  if (ctx.instance) {
	  	// console.log('create');
	    ctx.instance.created = new Date();
	  } 
	  next();
	});

};
