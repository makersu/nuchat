function DirectoryService($NUChatLinks, $checkFormat, METATYPE) {
	/* Methods */
	function saveToDir(item) {
		// console.log(item);
		switch (item.type) {
			case METATYPE.LINK:
				$NUChatLinks.push(item);
				break;
			case METATYPE.calendar:
				break;
			default:
				break;
		}
	}

	/* Instance */
	var _service = {
		saveToDirectory: saveToDir,
	};

	return _service;
}