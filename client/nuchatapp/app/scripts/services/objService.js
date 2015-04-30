function ObjService($cordovaCapture, $cordovaCamera, LBSocket, User, AccountService, METATYPE, $utils, $timeout) {
	var _currentRoom = null;
	var _currentOwner = null;
  var _fileReader = new FileReader();
  var _uploadQueue = [];
  
	function init(room, user) {
		_currentRoom = room;
		_currentOwner = user;
	}

  function readArrayBufferTask(file) {
    _fileReader.readAsArrayBuffer(file);
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

          _fileReader.onloadend = function(event) {
            console.log('onload')
            var data = {};
            data.userId = User.getCachedCurrent().id;//refactoring?
            data.file = event.target.result;
            data.type = file.type || $utils.getMimeType(file);
            //console.log(data);

            console.log('user:profile:avatar')
            LBSocket.emit('user:profile:avatar', data , function(err,profile){
              console.log(profile)
              if(profile){
                AccountService.setAvatarUrl(profile)
              }
            });
          }//onloadend

          _fileReader.readAsArrayBuffer(file);
        });
      }, 
      function(error){
        console.error(error)
      }
    );//end resolveLocalFileSystemURL
  }

  function choosePhotos(success, error, options) {
    window.imagePicker.getPictures(
      function(results) {
        success.call(this, results);
      }, error, options);
  }
  function capturePhoto(success, error) {
    $cordovaCapture.captureImage()
      .then(function(imgData) {
        success.call(this, imgData[0].fullPath);
      }, error);
  }
  function captureAudio(success, error) {
    $cordovaCapture.captureAudio()
      .then(function(audioData) {
        success.call(this, audioData[0].fullPath);
      }, error);
  }
  function captureVideo(success, error) {
    $cordovaCapture.captureVideo()
      .then(function(videoData) {
        success.call(this, videoData[0].fullPath);
      }, error);
  }
	function choosePhotosUpload(success, error, options) {
		window.imagePicker.getPictures(
      function(results) {
        var newMessages = [];
        // Uploading all the files.
        angular.forEach(results, function(photo) {
        	console.log('Image URI: ' + photo);
          var timestamp = new Date().getTime();
        	uploadFile(photo, timestamp);
          newMessages.push({text: photo, type: METATYPE.IMG, timestamp: timestamp});
        });
        success.call(this, newMessages);
      }, error, options);
	}
	function capturePhotoUpload(success, error) {
		$cordovaCapture.captureImage()
      .then(function(imgData) {
        // Uploading the captured.
        var timestamp = new Date().getTime();
        success.call( this, packageMessage(imgData, timestamp) );
        uploadFile(imgData[0].fullPath, timestamp);
      }, error);
	}
	function captureAudioUpload(success, error) {
		$cordovaCapture.captureAudio()
      .then(function(audioData) {
        // Uploading the captured.
        var timestamp = new Date().getTime();
        success.call( this, packageMessage(audioData, timestamp) );
        uploadFile(audioData[0].localURL, timestamp);
      }, error);
	}
	function captureVideoUpload(success, error) {
		$cordovaCapture.captureVideo()
      .then(function(videoData) {
        // Uploading the captured.
        var timestamp = new Date().getTime();
        success.call( this, packageMessage(videoData, timestamp) );
        uploadFile(videoData[0].localURL, timestamp);
      }, error);
	}
  function packageMessage(objData, timestamp, refUrl) {
    var file = objData[0];
    return { 
      type: file.type,
      text: file[refUrl || 'fullPath'],
      roomId: _currentRoom.id,
      ownerId: _currentOwner.id,
      filename: file.name,
      timestamp: timestamp
    };
  }
	function uploadFile(localUri, timestamp) {
		window.resolveLocalFileSystemURL(
      localUri, 
      function(fileEntry){
        // console.log(fileEntry);
        console.time('fileEntry.file');
        fileEntry.file(function(file) {
          // console.log(file);
          _uploadQueue.push({file: angular.copy(file), timestamp: timestamp});

          _fileReader.onloadend = function(event) {
            console.log('onload')
            //console.log(event.target)
            // console.log('room:files:new')
            var data = {};
            data.roomId = _currentRoom.id;
            data.ownerId = _currentOwner.id;
            data.file = event.target.result;
            data.filename = _uploadQueue[0].file.name;
            data.type = _uploadQueue[0].file.type || $utils.getMimeType(_uploadQueue[0].file);
            data.size = _uploadQueue[0].file.size;
            data.timestamp = _uploadQueue[0].timestamp;
            // console.log(data);

            console.timeEnd('fileEntry.file');

            LBSocket.emit('room:files:new', data);

            _uploadQueue.splice(0, 1);
            // To Check the task queue.
            if (_uploadQueue.length) {
              readArrayBufferTask(_uploadQueue[0].file);
            }
          }

          //_fileReader.readAsDataURL(file);
          // console.log(_fileReader.readyState);
          if (_fileReader.readyState !== 1) {
            readArrayBufferTask(_uploadQueue[0].file);
          }
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
		choosePhotosUpload: choosePhotosUpload,
		capturePhotoUpload: capturePhotoUpload,
		captureAudioUpload: captureAudioUpload,
		captureVideoUpload: captureVideoUpload,
    chooseAvatar: chooseAvatar,
    captureAvatar: captureAvatar
	};

	return _service;
}