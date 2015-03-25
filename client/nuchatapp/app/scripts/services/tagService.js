function TagService($filter) {
	/* Methods */
	function add(item, tag) {
		var tags = tag.trim().split(',');
		angular.forEach(tags, function(untrim) {
			var trimmedTag = untrim.trim();
			if (item.tags && item.tags.indexOf(trimmedTag) > -1) {
				return;
			} else {
				if (angular.isUndefined(item.tags)) item.tags = [];
				item.tags.push(trimmedTag);
			}
		});
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