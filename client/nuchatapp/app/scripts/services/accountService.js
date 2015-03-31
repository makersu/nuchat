function AccountService(User, ENV) {

  var avatarUrl;

  function getAvatarUrl(){
    return avatarUrl;
  }

  function setAvatarUrl(profile){
    console.log('setAvatarUrl')
    var avatarThumbnail;
    if(profile){
      avatarThumbnail=profile.avatarThumbnail
    }
    else{
      avatarThumbnail=User.getCachedCurrent().avatarThumbnail
    }

    if(avatarThumbnail){
      avatarUrl=ENV.GRIDFS_BASE_URL+avatarThumbnail
    }
    else{
      avatarUrl=undefined;
    }
    console.log(avatarUrl)
  }
	
  var service = {
    getAvatarUrl: getAvatarUrl,
    setAvatarUrl: setAvatarUrl
  };

  return service;

}