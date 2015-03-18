function LinkService($filter) {
  var _list = [];

  function push(link) {
    if (link) {
      var dups = $filter('filter')(_list, { id: link.id });
      console.log(link);
      if (dups.length === 0) {
        _list.push(link);
      }
    }
  }

  function remove(id) {
    var links = $filter('filter')(_list, { id: id });
    if (links.length > 0) {
      var idx = _list.indexOf(links);
      consol.elog(idx);
      _list.splice(idx, 1);
    }
  }

  function getLinks() {
    return _list;
  }

	var _service = {
		getLinks: getLinks,
		push: push,
		remove: remove,
	};

	return _service;
}