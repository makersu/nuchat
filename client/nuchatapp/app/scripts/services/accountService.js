function AccountService(User, ENV) {
	var user=User.getCachedCurrent()//
	console.log(user)
  updateAvatar();

  function updateAvatar(profile){
  	if(profile){
  		user.avatarOriginal=profile.avatarOriginal
  		user.avatarThumbnail=profile.avatarThumbnail
  	}
  	if(user.avatarThumbnail){
  		user.avatarThumbnail=ENV.GRIDFS_BASE_URL+user.avatarThumbnail
  		console.log(user.avatarThumbnail)
  	}
  }

  var service = {
		user: user,
		updateAvatar: updateAvatar
  };

  return service;

}