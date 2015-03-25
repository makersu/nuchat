function ObjService($cordovaCapture, LBSocket) {
	var _currentRoom = null;
	var _currentOwner = null;

	function init(room, user) {
		_currentRoom = room;
		_currentOwner = user;
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
        uploadFile(imgData[0].fullPath);
      }, error);
	}
	function captureAudioUpload(success, error) {
		$cordovaCapture.captureAudio()
      .then(function(audioData) {
        success.call(this, audioData[0].localURL);
        // Uploading the captured.
        uploadFile(audioData[0].localURL);
      }, error);
	}
	function captureVideoUpload(success, error) {
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
          console.log(file)
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
		choosePhotosUpload: choosePhotosUpload,
		capturePhotoUpload: capturePhotoUpload,
		captureAudioUpload: captureAudioUpload,
		captureVideoUpload: captureVideoUpload,
	};

	return _service;
}