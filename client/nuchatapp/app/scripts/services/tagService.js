function TagService($filter) {
	/* Variables */
	var _itemList = null;
	var _filteredList = [];
	var _tags = {};

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
				// console.log(item.tags);
			}
		});
	}
	function remove(item, idx) {
		item.tags.splice(idx, 1);
	}
	function getTagList() {
		return { tags: _tags };
	}
	function setItemList(list) {
		_itemList = list;
		extractTags();
	}
	function filterList() {
		var filterTags = $filter('filter')(_tags, {selected: true});
		_filteredList = $filter('tagFilter')(_itemList, filterTags);
	}
	function getFilteredList() {
		return _filteredList;
	}
	function extractTags() {
		_tags = [];
		angular.forEach(_itemList, function(item) {
			angular.forEach(item.tags, function(tag) {
				var dups = $filter('filter')(_tags, { name: tag });
				if (dups.length === 0) {
					_tags.push({name: tag});
				}
			});
		});
	}

	/* Instance */
	var _service = {
		add: add,
		remove: remove,
		getTagList: getTagList,
		setItemList: setItemList,
		filterList: filterList,
		getFilteredList: getFilteredList,
	};

	return _service;
}