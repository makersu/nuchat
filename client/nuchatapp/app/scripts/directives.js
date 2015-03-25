angular.module('Nuchatapp.directives', [])
	.directive('linkinapp', function($jmTools, $timeout) {
		return {
			restrict: 'A',
			link: function(scope, elem, attrs) {
				var id = null;
				$timeout(function() {
					id = attrs.linkinapp;
				});
				scope.$on('urlViewLoaded', function(event, args) {
					$timeout(function() {
						if (args[id]) {
							// console.log('parsing linkinapp');
							$jmTools.parseATagUsingInAppBrowser(elem[0].children);
						}
					});
				});
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