function TagService($filter) {
	/* Variables */
	var _itemList = null;
	var _filteredList = [];
	var _tags = {};

	/* Methods */
	function add(item, tag) {
		if(!tag){
			return;
		}
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
		updateTags();
	}
	function remove(item, idx) {
		item.tags.splice(idx, 1);
		updateTags();
	}
	function getTagList() {
		return { tags: _tags };
	}
	function setItemList(list) {
		_filteredList = _itemList = list;
		updateTags();
	}
	function filterList() {
		var filterTags = $filter('filter')(_tags, {selected: true});
		_filteredList = $filter('tagFilter')(_itemList, filterTags);
	}
	function getFilteredList() {
		return _filteredList;
	}
	function getOriginalList() {
		return _itemList;
	}
	function updateTags() {
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
	// Special Tags
	function isFavorite(item) {
		return item && item.tags ? (item.tags.indexOf('Favorite') > -1) : false;
	}
	function setFavorite(item) {
		if (item.tags) {
			var idx = item.tags.indexOf('Favorite');
			if (idx === -1) {
				add(item, 'Favorite');
			} else {
				remove(item, idx);
			}
		} else {
			add(item, 'Favorite');
		}
	}
	function isLike(item) {
		return item.tags ? (item.tags.indexOf('Like') > -1) : false;
	}
	function setLike(item) {
		if (item.tags) {
			var idx = item.tags.indexOf('Like');
			if (idx === -1) {
				add(item, 'Like');
			} else {
				remove(item, idx);
			}
		} else {
			add(item, 'Like');
		}
	}

	/* Instance */
	var _service = {
		add: add,
		remove: remove,
		getTagList: getTagList,
		setItemList: setItemList,
		filterList: filterList,
		getFilteredList: getFilteredList,
		getOriginalList: getOriginalList,
		setFavorite: setFavorite,
		isFavorite: isFavorite,
		setLike: setLike,
		isLike: isLike,
	};

	return _service;
}