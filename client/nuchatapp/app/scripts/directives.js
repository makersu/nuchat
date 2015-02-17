angular.module('Nuchatapp.directives', [])
	.directive('linkinapp', function($timeout, $jmTools) {
		return {
			restrict: 'A',
			link: function(scope, elem, attrs) {
				var phase = parseInt(attrs.linkinapp) || 1;
				$timeout(function() {
					$jmTools.parseATagUsingInAppBrowser(elem[0].children);
					if (phase > 1) {
						$timeout(function() {
							$jmTools.parseATagUsingInAppBrowser(elem[0].children);
						}, 1000);
					}
				}, 500);
			}
		}
	});