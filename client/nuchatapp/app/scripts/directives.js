angular.module('Nuchatapp.directives', [])
	.directive('linkinapp', function($timeout, $jmTools) {
		return {
			restrict: 'A',
			link: function(scope, elem, attrs) {
				$timeout(function() {
					$jmTools.parseATagUsingInAppBrowser(elem[0].children);
				}, 400);
			}
		}
	});