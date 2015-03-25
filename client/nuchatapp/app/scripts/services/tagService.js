function TagService($filter) {
	/* Methods */
	function add(item, tag) {
		if (item.tags && item.tags.indexOf(tag) > -1) {
			return;
		} else {
			if (angular.isUndefined(item.tags)) item.tags = [];
			item.tags.push(tag);
		}
	}
	function remove(item, idx) {
		item.tags.splice(idx, 1);
	}

	/* Instance */
	var _service = {
		add: add,
		remove: remove,
	};

	return _service;
}