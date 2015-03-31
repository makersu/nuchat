function ObjService($cordovaCapture, $cordovaCamera, LBSocket, User, AccountService, METATYPE) {
	var _currentRoom = null;
	var _currentOwner = null;
  
	function init(room, user) {
		_currentRoom = room;
		_currentOwner = user;
	}

  function chooseAvatar(success, error, options) {
    console.log('chooseAvatar');
    var cameraOptions = { sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                          correctOrientation: true, allowEdit: true,
                          mediaType: Camera.MediaType.PICTURE };
    angular.forEach(options, function(value, opt) {
      cameraOptions[opt] = value;
    });
    $cordovaCamera.getPicture(cameraOptions)
      .then(function(result) {
        success.call(this, result);
        // Uploading the chosen file.
        console.log('Image URI: ' + result);
        uploadAvatar(result);
      }, error);
  }

  function captureAvatar(success, error) {
    $cordovaCapture.captureImage()
      .then(function(imgData) {
        success.call(this, imgData[0].fullPath);//
        console.log(imgData[0].fullPath);
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
            data.userId = User.getCachedCurrent().id;//refactoring?
            data.file = event.target.result;
            console.log(file);
            data.type = file.type || METATYPE.IMG+'/jpeg';
            //console.log(data);

            console.log('user:profile:avatar')
            LBSocket.emit('user:profile:avatar', data , function(err,profile){
              console.log(profile)
              if(profile){
                AccountService.setAvatarUrl(profile)
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

	function choosePhotosUpload(success, error, options) {
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
	function capturePhotoUpload(success, error) {
		$cordovaCapture.captureImage()
      .then(function(imgData) {
        success.call(this, imgData[0].fullPath);
        // Uploading the captured.
        uploadFile(imgData[0].fullPath, METATYPE.IMG);
      }, error);
	}
	function captureAudioUpload(success, error) {
		$cordovaCapture.captureAudio()
      .then(function(audioData) {
        success.call(this, audioData[0].localURL);
        // Uploading the captured.
        uploadFile(audioData[0].localURL, METATYPE.AUDIO);
      }, error);
	}
	function captureVideoUpload(success, error) {
		$cordovaCapture.captureVideo()
      .then(function(videoData) {
        success.call(this, videoData[0].localURL);
        // Uploading the captured.
        uploadFile(videoData[0].localURL, METATYPE.VIDEO);
      }, error);
	}
	function uploadFile(localUri, type) {
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
            data.type = file.type || type;
            data.size = file.size;
            console.log(data);

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
		choosePhotosUpload: choosePhotosUpload,
		capturePhotoUpload: capturePhotoUpload,
		captureAudioUpload: captureAudioUpload,
		captureVideoUpload: captureVideoUpload,
    chooseAvatar: chooseAvatar,
    captureAvatar: captureAvatar
	};

	return _service;
}