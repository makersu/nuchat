module.exports = function(room) {
		room.beforeCreate = function(next, modelInstance) {
		modelInstance.created = new Date();
		console.log(modelInstance)
	  //your logic goes here
	  next();
	};

};
