function ObjService($cordovaCapture, LBSocket, AccountService) {
	var _currentRoom = null;
	var _currentOwner = null;
  var user=AccountService.user
  // updateAvatar();
  
	function init(room, user) {
		_currentRoom = room;
		_currentOwner = user;
	}

  function chooseAvatar(success, error, options) {
    console.log('chooseAvatar')
    window.imagePicker.getPictures(
      function(results) {
        success.call(this, results);
        // Uploading all the files.
        angular.forEach(results, function(photo) {
          console.log('Image URI: ' + photo);
          uploadAvatar(photo);
        });
      }, error, options);
  }

  function captureAvatar(success, error) {
    $cordovaCapture.captureImage()
      .then(function(imgData) {
        success.call(this, imgData[0].fullPath);
        // Uploading the captured.
        uploadAvatar(imgData[0].fullPath);
      }, error);
  }

  function uploadAvatar(localUri) {
    console.log('uploadAvatar')
    window.resolveLocalFileSystemURL(
      localUri, 
      function(fileEntry){
        // console.log(fileEntry);
        fileEntry.file(function(file) {
          //console.log(file)
          var reader = new FileReader();

          reader.onloadend = function(event) {
            console.log('onload')
            var data = {};
            // console.log(User.getCachedCurrent())
            data.userId = user.id;
            data.file = event.target.result;
            data.type = file.type;
            //console.log(data);
            console.log('user:profile:avatar')
            LBSocket.emit('user:profile:avatar', data , function(err,profile){
              console.log(profile)
              if(profile){
                // user.avatarOriginal=profile.avatarOriginal
                // user.avatarThumbnail=profile.avatarThumbnail
                AccountService.updateAvatar(profile)
              }
            });
          }//onloadend

          reader.readAsArrayBuffer(file);
        });
      }, 
      function(error){
        console.error(error)
      }
    );//end resolveLocalFileSystemURL
  }

  // function updateAvatar(profile){
  //   if(profile){
  //     user.avatarOriginal=profile.avatarOriginal
  //     user.avatarThumbnail=profile.avatarThumbnail
  //   }
  //   if(user.avatarThumbnail){
  //     user.avatarThumbnail=ENV.GRIDFS_BASE_URL+user.avatarThumbnail
  //     console.log(user.avatarThumbnail)
  //   }
  // }

	function choosePhotos(success, error, options) {
		window.imagePicker.getPictures(
      function(results) {
        success.call(this, results);
        // Uploading all the files.
        angular.forEach(results, function(photo) {
        	console.log('Image URI: ' + photo);
        	uploadFile(photo);
        });
      }, error, options);
	}
	function capturePhoto(success, error) {
		$cordovaCapture.captureImage()
      .then(function(imgData) {
        success.call(this, imgData[0].fullPath);
        // Uploading the captured.
        uploadFile(imgData[0].fullPath);
      }, error);
	}
	function captureAudio(success, error) {
		$cordovaCapture.captureAudio()
      .then(function(audioData) {
        success.call(this, audioData[0].localURL);
        // Uploading the captured.
        uploadFile(audioData[0].localURL);
      }, error);
	}
	function captureVideo(success, error) {
		$cordovaCapture.captureVideo()
      .then(function(videoData) {
        success.call(this, videoData[0].fullPath);
        // Uploading the captured.
        uploadFile(videoData[0].fullPath);
      }, error);
	}
	function uploadFile(localUri) {
		window.resolveLocalFileSystemURL(
      localUri, 
      function(fileEntry){
        // console.log(fileEntry);
        fileEntry.file(function(file) {
          //console.log(file)
          var reader = new FileReader();

          reader.onloadend = function(event) {
            console.log('onload')
            //console.log(event.target)
            console.log('room:files:new')
            var data = {};
            data.roomId = _currentRoom.id;
            data.ownerId = _currentOwner.id;
            data.file = event.target.result;
            data.filename = file.name;
            data.type = file.type;
            data.size = file.size;
            console.log(data);

            //LBSocket.emit('room:files:new', {image:event.target.result, room:$scope.room, ownerId: $scope.currentUser.id });
            LBSocket.emit('room:files:new', data);
          }

          //reader.readAsDataURL(file);
          reader.readAsArrayBuffer(file);
        });
      }, 
      function(error){
        console.error(error)
      }
    );//end resolveLocalFileSystemURL
	}

	var _service = {
		init: init,
		choosePhotos: choosePhotos,
		capturePhoto: capturePhoto,
		captureAudio: captureAudio,
		captureVideo: captureVideo,
    chooseAvatar: chooseAvatar
	};

	return _service;
}