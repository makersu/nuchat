angular.module('Nuchatapp.directives', [])
  .directive('rangeCal', function($rootScope) {
      return {
          restrict: 'AE',
          scope:{
              now: '@'
          },
          link: function(scope, element, attrs) {
              var triggerRelink = function(){
                  $(element).rangeCalendar({
                    lang: attrs.lang,
                      theme: attrs.theme,
                      start: attrs.start,
                      startRangeWidth: parseInt(attrs.startRangeWidth),
                      minRangeWidth: parseInt(attrs.minRangeWidth),
                      maxRangeWidth: parseInt(attrs.maxRangeWidth),
                      changeRangeCallback: function( el, cont, dateProp ) {
                          localStorage.setItem('date-id', JSON.stringify(cont));
                          return false;
                      }
                  }).setStartDate(scope.now);
              }

              triggerRelink();                
              $rootScope.$on(attrs.relinkEvent, triggerRelink);
          }
      };
  })
	.directive('videoView', function ($rootScope, $timeout) {
    return {
      restrict: 'E',
      template: '<div class="video-container"></div>',
      replace: true,
      link: function (scope, element, attrs) {
        function updatePosition(event, args) {
        	var callInProgress = (args && args.callInProgress) || false;
        	var config = { container: element[0] };
        	var local = callInProgress ? {
        		position: [element[0].offsetWidth-5-verge.viewportW()/4, element[0].offsetHeight-verge.viewportW()/8],
            size: [verge.viewportW()/4, verge.viewportW()/4]
        	} : null;
        	local && (config.local = local);
        	console.log('updatePosition');
          cordova.plugins.phonertc.setVideoView(config);
        }

        $timeout(updatePosition, 500);
        $rootScope.$on('videoView.updatePosition', updatePosition);
      }
    }
  })
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
  .directive('unreadNote', ['$filter', function($filter) {
    return {
      restrict: 'E',
      template: '<div class="unread-note"><hr>'+$filter('translate')('FOLLOWING_UNREAD')+'<hr></div>',
    };
  }]);