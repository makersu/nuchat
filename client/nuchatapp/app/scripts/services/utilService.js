function UtilService($filter) {
	var MIMETYPES = [
		// Image
		{ ext: 'bmp', type: 'image/bmp' }, { ext: 'gif', type: 'image/gif' }, { ext: 'jpe', type: 'image/jpeg' }, { ext: 'jpeg', type: 'image/jpeg' }, { ext: 'jpg', type: 'image/jpeg' }, { ext: 'svg', type: 'image/svg+xml' }, { ext: 'tif', type: 'image/tiff' }, { ext: 'tiff', type: 'image/tiff' }, { ext: 'ico', tyep: 'image/x-icon' },
		// Audio
		{ ext: 'au', type: 'audio/basic' }, { ext: 'snd', type: 'audio/basic' }, { ext: 'mid', type: 'audio/mid' }, { ext: 'mp3', type: 'audio/mpeg' }, { ext: 'aif', type: 'audio/x-aiff' }, { ext: 'aifc', type: 'audio/x-aiff' }, { ext: 'aiff', type: 'audio/x-aiff' }, { ext: 'm3u', type: 'audio/x-mpegurl' }, { ext: 'ra', type: 'audio/x-pn-realaudio' }, { ext: 'ram', type: 'audio/x-pn-realaudio' }, { ext: 'wav', type: 'audio/x-wav' },
		// Video
		{ ext: 'mp2', type: 'video/mpeg' }, { ext: 'mpa', type: 'video/mpeg' }, { ext: 'mpe', type: 'video/mpeg' }, { ext: 'mpeg', type: 'video/mpeg' }, { ext: 'mpg', type: 'video/mpeg' }, { ext: 'mpv2', type: 'video/mpeg' }, { ext: 'mov', type: 'video/quicktime' }, { ext: 'qt', type: 'video/quicktime' }, { ext: 'asf', type: 'video/x-ms-asf' }, { ext: 'asr', type: 'video/x-ms-asf' }, { ext: 'asx', type: 'video/x-ms-asf' }, { ext: 'avi', type: 'video/x-msvideo' }, { ext: 'movie', type: 'video/x-sgi-movie' }, 
	];

	function sameDate(date1, date2) {
		var d1 = new Date(date1);
		var d2 = new Date(date2);
		return d1.getFullYear() == d2.getFullYear() && d1.getMonth() == d2.getMonth() && d1.getDate() == d2.getDate();
	}

	function getMimeType(file) {
		var ext = file.name.substr(file.name.lastIndexOf('.')+1);
		var types = $filter('filter')(MIMETYPES, { ext: ext });
		console.log(types);
		if (types.length) {
			return types[0].type;
		} else {
			return null;
		}
	}

	return {
		sameDate: sameDate,
		getMimeType: getMimeType,
	};
}