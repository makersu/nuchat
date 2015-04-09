function DirectoryService($NUChatFiles, $NUChatLinks, METATYPE) {
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
				// Otherwise, as a file.
				if (item.type) $NUChatFiles.push(item);
				break;
		}
	}

	/* Instance */
	var _service = {
		saveToDirectory: saveToDir,
	};

	return _service;
}