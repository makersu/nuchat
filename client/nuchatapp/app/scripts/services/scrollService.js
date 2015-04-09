function ScrollService($imageFilters, $ionicScrollDelegate, $filter, $timeout) {
	var FIXED_TO_TOP_OFFSET = 105;
	var CONTAINER_INIT_HEIGHT;
	var CONTAINER_FIXED_HEIGHT;
	var _cover = null;
	var _coverOriginalHeight = 0;
	var _dirTabs = null;
	var _dirTabsOriginalTop = 0;
	var _coverImg = null;
	var _container = null;
	var _lastY;
	var _cummulatedDiff = 0;
	var _scrollView = null;

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
	function setContainer(containerSelector) {
		// Reset the content container to avoid the cached.
		if (_scrollView) {
			// console.log(_scrollView);
			_container = _scrollView[0].querySelector(containerSelector);
			// console.log(_container);
			setContainerHeight(CONTAINER_FIXED_HEIGHT);
		}
	}
	function setContainerHeight(h) {
		// if (!_container) _container = _scrollView[0].querySelector(_containerSelector);
		angular.element(_container).css('height', h+'px');
		resize();
	}
	function resize() {
		var scrollHandles = $filter('filter')($ionicScrollDelegate._instances, {$$delegateHandle: 'dirScrollHandle'});
		if (scrollHandles.length) {
			var dirScrollHandle = scrollHandles[0];
			// console.log(dirScrollHandle);
			// console.log($ionicScrollDelegate.$getByHandle('dirScrollHandle'));
			dirScrollHandle.resize();
		}
	}
	function getScrollTop() {
		return $ionicScrollDelegate.getScrollPosition().top;
	}
	function getCoverHeight() {
		if (!_cover) {
			_cover = _scrollView[0].querySelector('.cover');
		}
		return _cover.offsetHeight;
	}
	function setCoverHeight(h) {
		angular.element(_cover).css('height', h+'px');
	}
	function getCoverImg() {
		if (!_coverImg) {
			_coverImg = _scrollView[0].querySelector('.cover img');
		}
		return _coverImg;
	}
	function getDirTabsHeight() {
		if (!_dirTabs) {
			_dirTabs = _scrollView[0].querySelector('.directory .tabs');
		}
		return _dirTabs.offsetHeight;
	}
	function getDirTabsTop() {
		if (!_dirTabs) {
			_dirTabs = _scrollView[0].querySelector('.directory .tabs');
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
			// setContainerHeight( CONTAINER_INIT_HEIGHT+(CONTAINER_FIXED_HEIGHT-CONTAINER_INIT_HEIGHT)*_cummulatedDiff/FIXED_TO_TOP_OFFSET );
		} else if (_cummulatedDiff >= FIXED_TO_TOP_OFFSET) {
			setCoverHeight(_coverOriginalHeight - FIXED_TO_TOP_OFFSET);
			setDirTabsTop(_dirTabsOriginalTop - FIXED_TO_TOP_OFFSET);
			// setContainerHeight(CONTAINER_FIXED_HEIGHT);
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
		var coverImg = _scrollView[0].querySelector('.cover img');
		setCoverHeight(_coverOriginalHeight);
		setDirTabsTop(_dirTabsOriginalTop);
		// Un-Blur effects
		$imageFilters.cssBlur(coverImg, 0);

		if (!CONTAINER_INIT_HEIGHT) {
			// console.log('compute init content height');
			CONTAINER_INIT_HEIGHT = verge.viewportH()-_coverOriginalHeight-getDirTabsHeight();
			CONTAINER_FIXED_HEIGHT = CONTAINER_INIT_HEIGHT+FIXED_TO_TOP_OFFSET;
		}
		// if (_container) {
		setContainerHeight(CONTAINER_FIXED_HEIGHT);
		// }
	}
	function bindScrollToFixed(containerSelector, viewSelector) {
		// Reset the scroll view to avoid the cached.
		var scrollView = document.querySelector(viewSelector);
		// If the same view, do not need to bind again.
		if (_scrollView && _scrollView[0].ng339 === angular.element(scrollView)[0].ng339) {
			return;
		}
		// console.log(scrollView);
		_scrollView = angular.element(scrollView);
		_container = _scrollView[0].querySelector(containerSelector);
		setContainerHeight(containerSelector);
		// Reset the cover image to avoid the cached.
		_cover = _scrollView[0].querySelector('.cover');
		_coverImg = _scrollView[0].querySelector('.cover img');
		// Reset the tabs to avoid the cached.
		_dirTabs = _scrollView[0].querySelector('.directory .tabs');
		// Reset to initial state.
		reset();

		// Binding the touch events.
		_scrollView.off('touchmove').on('touchmove', function(e) {
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
		_scrollView.off('touchend').on('touchend', function() {
			_lastY = undefined;
		});
	}

	var _service = {
		// getScrollView: getScrollView,
		// getFamousScrollPosition: getFamousScrollPosition,
		setContentContainer: setContainer,
		getCoverHeight: getCoverHeight,
		setCoverHeight: setCoverHeight,
		scrollToFixed: scrollToFixed,
		bindScrollToFixed: bindScrollToFixed,
		resize: resize,
		reset: reset
	}

	return _service;
}