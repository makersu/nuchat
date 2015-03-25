function ScrollService($imageFilters, $ionicScrollDelegate) {
	var FIXED_TO_TOP_OFFSET = 105;
	var CONTAINER_INIT_HEIGHT = 65;
	var CONTAINER_FIXED_HEIGHT = 84;
	var _cover = null;
	var _coverOriginalHeight = 0;
	var _dirTabs = null;
	var _dirTabsOriginalTop = 0;
	var _coverImg = null;
	var _container = null;
	var _lastY;
	var _cummulatedDiff = 0;

	// function getScrollView(selector) {
	// 	if (selector) {
	// 		return $famous.find(selector)[0].renderNode;
	// 	}
	// 	return null;
	// }
	// function getFamousScrollPosition(selector) {
	// 	var scrollView = getScrollView(selector);
	// 	return scrollView.getPosition();
	// }
	function setContainerHeight(h) {
		angular.element(_container).css('height', h+'%');
	}
	function getScrollTop() {
		return $ionicScrollDelegate.getScrollPosition().top;
	}
	function getCoverHeight() {
		if (!_cover) {
			_cover = document.querySelector('.cover');
		}
		return _cover.offsetHeight;
	}
	function setCoverHeight(h) {
		angular.element(_cover).css('height', h+'px');
	}
	function getCoverImg() {
		if (!_coverImg) {
			_coverImg = document.querySelector('.cover img');
		}
		return _coverImg;
	}
	function getDirTabsTop() {
		if (!_dirTabs) {
			_dirTabs = document.querySelector('.directory .tabs');
		}
		return _dirTabs.offsetTop;
	}
	function setDirTabsTop(t) {
		angular.element(_dirTabs).css('top', t+'px');
	}
	function scrollToFixed(up, diff) {
		if (!_coverOriginalHeight) {
			_coverOriginalHeight = getCoverHeight();
		}
		if (!_dirTabsOriginalTop) {
			_dirTabsOriginalTop = getDirTabsTop();
		}
		var coverImg = getCoverImg();
		if (up && _cummulatedDiff < FIXED_TO_TOP_OFFSET) {
			_cummulatedDiff += diff;
		} else if (!up && _cummulatedDiff > 0 && getScrollTop() <= 0) {
			_cummulatedDiff -= diff;
		}
		// var scrollPos = getScrollTop();//getScrollPosition(selector);
		if (_cummulatedDiff < FIXED_TO_TOP_OFFSET && _cummulatedDiff > 0) {
			setCoverHeight(_coverOriginalHeight - _cummulatedDiff);
			setDirTabsTop(_dirTabsOriginalTop - _cummulatedDiff);
			// Blur effects
			// console.log(_cummulatedDiff);
			var radius = 10*_cummulatedDiff/FIXED_TO_TOP_OFFSET;
			$imageFilters.cssBlur(coverImg, radius);
			setContainerHeight( CONTAINER_INIT_HEIGHT+(CONTAINER_FIXED_HEIGHT-CONTAINER_INIT_HEIGHT)*_cummulatedDiff/FIXED_TO_TOP_OFFSET );
		} else if (_cummulatedDiff >= FIXED_TO_TOP_OFFSET) {
			setCoverHeight(_coverOriginalHeight - FIXED_TO_TOP_OFFSET);
			setDirTabsTop(_dirTabsOriginalTop - FIXED_TO_TOP_OFFSET);
			setContainerHeight(CONTAINER_FIXED_HEIGHT);
		} else if (_cummulatedDiff <= 0) {
			reset();
		}
	}
	function reset() {
		if (!_coverOriginalHeight) {
			_coverOriginalHeight = getCoverHeight();
		}
		if (!_dirTabsOriginalTop) {
			_dirTabsOriginalTop = getDirTabsTop();
		}
		var coverImg = document.querySelector('.cover img');
		setCoverHeight(_coverOriginalHeight);
		setDirTabsTop(_dirTabsOriginalTop);
		// Un-Blur effects
		$imageFilters.cssBlur(coverImg, 0);
		setContainerHeight(CONTAINER_INIT_HEIGHT);
	}
	function bindScrollToFixed(containerSelector, viewSelector) {
		_container = document.querySelector(containerSelector);
		var view = angular.element(document.querySelector(viewSelector));
		view.on('touchmove', function(e) {
			var currentY = e.touches[0].clientY;
	    if (currentY > _lastY) {
	    	// Move down
				scrollToFixed(false, currentY-_lastY);
	    } else if(currentY < _lastY) {
	    	// Move up
				scrollToFixed(true, _lastY-currentY);
	    }
	    _lastY = currentY;
		});
		view.on('touchend', function() {
			_lastY = undefined;
		});
	}

	var _service = {
		// getScrollView: getScrollView,
		// getFamousScrollPosition: getFamousScrollPosition,
		getCoverHeight: getCoverHeight,
		setCoverHeight: setCoverHeight,
		scrollToFixed: scrollToFixed,
		bindScrollToFixed: bindScrollToFixed,
		reset: reset
	}

	return _service;
}