function FileService($filter) {
	/* Variables */
	// Private
	var _list = [];
	var _service = {
		getFiles: getFiles,
		push: push,
		remove: remove,
    reset: reset,
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

  function getFiles() {
    // console.log(msgList);
    // console.log(METATYPE.LINK);
    // _list = $filter('filter')(msgList, {type: METATYPE.LINK});
    console.log(_list);
    return _list;
  }

  function reset() {
    _list = [];
  }
	// Public

	return _service;
}