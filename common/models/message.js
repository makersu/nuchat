module.exports = function(message) {
	message.beforeCreate = function(next, modelInstance) {
		modelInstance.created = new Date();
		console.log(modelInstance)
	  //your logic goes here
	  next();
	};

};
