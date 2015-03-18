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
	})
	.directive('contenteditable', ['$sce', function($sce) {
	  return {
	    restrict: 'A', // only activate on element attribute
	    require: '?ngModel', // get a hold of NgModelController
	    link: function(scope, element, attrs, ngModel) {
	      if (!ngModel) return; // do nothing if no ng-model

	      // Specify how UI should be updated
	      ngModel.$render = function() {
	        element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
	      };

	      // Listen for change events to enable binding
	      element.on('keyup change', function() {
	        scope.$evalAsync(read);
	      });
	      read(); // initialize

	      // Write data to the model
	      function read() {
	        var html = element.html();
	        // When we clear the content editable the browser leaves a <br> behind
	        // If strip-br attribute is provided then we strip this out
	        if ( attrs.stripBr && html == '<br>' ) {
	          html = '';
	        }
	        ngModel.$setViewValue(html);
	      }
	    }
	  };
	}]);