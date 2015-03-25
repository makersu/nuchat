(function() {
	var jangularMobile = angular.module('jangular.mobile', []);

	jangularMobile.factory('$jmTools', function() {
		var _self = this;

		// Using the Cordova inappbrowser plugin instead the direct click through A tag.
		_self.parseATagUsingInAppBrowser = function(elemArr) {
			// console.warn('Don\'t forget to include the cordova InAppBrowser plugin');
			if (!cordova || !window.open) {
				throw 'Cordova and the plugin, InAppBrowser, are required.';
			}
			angular.forEach(elemArr, function(elem) {
				if (elem.tagName == 'A') {
					if (elem.href) {
						var extLink = elem.href;
						elem.href = 'javascript:';
						angular.element(elem).bind('click', function() {
							window.open(extLink, '_blank', 'location=no,enableViewportScale=yes');
						});
					}
				}
				_self.parseATagUsingInAppBrowser(elem.children);
			});
		};

		return _self;
	});

	return jangularMobile;
})();