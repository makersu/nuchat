function AccountService(User, ENV, LBSocket) {

  var avatarUrl;

  function getAvatarUrl(){
    return avatarUrl;
  }

  //Refactoring if no profile
  function setAvatarUrl(profile){
    console.log('setAvatarUrl')
    var avatarThumbnail;
    var avatarLetter;
    if(profile){
      avatarThumbnail=profile.avatarThumbnail
    }
    else{
      avatarThumbnail=User.getCachedCurrent().avatarThumbnail
      avatarLetter=User.getCachedCurrent().avatarLetter
    }

    if(avatarThumbnail){
      avatarUrl=ENV.GRIDFS_BASE_URL+avatarThumbnail
    }
    else if(avatarLetter){
      avatarUrl=ENV.GRIDFS_BASE_URL+avatarLetter
    }
    else{
      avatarUrl=undefined;
      console.log('user:profile:letteravatar')
      LBSocket.emit('user:profile:letteravatar', User.getCachedCurrent(),function(err,profile){
        console.log(profile)
        avatarLetter=profile.avatarLetter
        avatarUrl=ENV.GRIDFS_BASE_URL+avatarLetter
      });//
    }
    console.log(avatarUrl)
  }
	
  var service = {
    getAvatarUrl: getAvatarUrl,
    setAvatarUrl: setAvatarUrl
  };

  return service;

}