function FileService($rootScope, $filter, $checkFormat, $imageViewer, METATYPE, ENV) {
	/* Variables */
	// Private
	var _list = [];
	var _service = {
		getFiles: getFiles,
		push: push,
		remove: remove,
    reset: reset,
    getImages: getImages,
    getVideos: getVideos,
    getAudios: getAudios,
    setTypeImg: setTypeImg,
    playFile: playFile,
	};
	// Public

	/* Methods */
	// Private
	function push(file) {
    if (file) {
      var dups = $filter('filter')(_list, { id: file.id });
      // console.log(file);
      if (dups.length === 0) {
        _list.push(file);
      }
    }
  }

  function remove(fileId) {
    var links = $filter('filter')(_list, { id: fileId });
    if (links.length > 0) {
      var idx = _list.indexOf(links[0]);
      _list.splice(idx, 1);
    }
  }

  function getFiles(msgList) {
    _list = $filter('filter')(_.values(msgList), function(item) {
      return item.type && item.type !== METATYPE.LINK && item.type !== METATYPE.CALENDAR && item.type !== METATYPE.MAP;
    });
    _list = $filter('orderBy')(_list, '-created');

    angular.forEach(_list, function(file) {
      setTypeImg(file);

      if ($checkFormat.isVideo(file.type)) {
        file.isVideo = true;
      }

      if (file.thumbnailFileId && !file.thumbUrl) {
        file.thumbUrl = ENV.GRIDFS_BASE_URL+file.thumbnailFileId;
      }
    });
    return _list;
  }

  function reset() {
    _list = [];
  }
	// Public
  function getImages(fileList) {
    return $filter('filter')(fileList || _list, function(item) {
      return $checkFormat.isImg(item.type);
    });
  }
  function getVideos(fileList) {
    return $filter('filter')(fileList || _list, function(item) {
      return $checkFormat.isVideo(item.type);
    });
  }
  function getAudios(fileList) {
    return $filter('filter')(fileList || _list, function(item) {
      return $checkFormat.isAudio(item.type);
    });
  }
  function setTypeImg(file) {
    $checkFormat.isAudio(file.type) && (function() {
      file.typeImg = 'images/music.png'
    })();
  }
  function playFile(file) {
    $checkFormat.isImg(file.type) && (function() {
      var imgs = getImages();
      var idx = imgs.indexOf(file);
      console.log(idx);
      $imageViewer.show(imgs, idx, { imgSrcProp: 'thumbUrl' });
    })();

    ( $checkFormat.isAudio(file.type) || $checkFormat.isVideo(file.type) ) && (function() {
      console.log( ENV.GRIDFS_BASE_URL+file.originalFileId );
      $rootScope.openInappbrowser(ENV.GRIDFS_BASE_URL+file.originalFileId);
    })();
  }

	return _service;
}