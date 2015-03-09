function ObjService($cordovaCapture) {

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
        success.call(this, audioData[0].localURL);
      }, error);
	}
	function captureVideo(success, error) {
		$cordovaCapture.captureVideo()
      .then(function(videoData) {
        success.call(this, videoData[0].fullPath);
      }, error);
	}

	var _service = {
		choosePhotos: choosePhotos,
		capturePhoto: capturePhoto,
		captureAudio: captureAudio,
		captureVideo: captureVideo,
	};

	return _service;
}