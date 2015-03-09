/**
 *  (Partial) Jangular UI directives
 *  @author   James Hsiao
 *  @lib      Ionic App Labs
 *
 *  Include:
 *  1) Meta-Message
 */
(function() {
	var jangularUI = angular.module('jangular.ui', ['Nuchatapp.configs']);

	var METATYPE = {
		IMG:   	  0,
		LINK:  	  1,
		MAP:      2,
		AUDIO:    3,
		VIDEO:    4,
		FILE:     5, // Including documents?
		UNKNOWN: -1,
	};

	function getLinks(content) {
		if (content) {
			return content.toLowerCase().match(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:\/~\+#]*[\w\-\@?^=%&amp;\/~\+#])?/);			
		}
	}

	// function isImg(content) {
	// 	if (content) {
	// 		var ext = content.substr(content.lastIndexOf('.'));
	// 		if ( ext.match(/jpg|jpeg|png|bmp|gif|tiff|tif|svg/) ) {
	// 			return true;
	// 		}
	// 	}
	// 	return false;
	// }

	function isImg(contentType) {
		if (contentType && contentType.indexOf('image') != -1) {			
				return true;
		}
		return false;
	}


	function isAudio(content) {
		if (content) {
			var ext = content.substr(content.lastIndexOf('.'));
			if ( ext.match(/3gp|3gpp|mp3|ogg|wav|m4a|m4b|m4p|m4v|m4r|aac|mp4/) ) {
				return true;
			}
		}
		return false;
	}

	function isVideo(content) {
		if (content) {
			var ext = content.substr(content.lastIndexOf('.'));
			if ( ext.match(/ogg|mp4|webm/) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Meta Message
	 * 
	 * @support
	 * 1) Hyper-link
	 * 2) Image: jpg|jpeg|png|bmp|gif|tiff|tif|svg
	 * 3) Audio: 3gp|3gpp|mp3|ogg|wav|m4a|m4b|m4p|m4v|m4r|aac|mp4
	 * 4) Video: ogg|mp4|webm (HTML 5 Video supports)
	 */
	jangularUI.directive('metaMsg', function($http, $q, $compile, $urlView, ENV) {
		return {
			restrict: 'EA',
			scope: {
				msg: '=',
				type: '=',
				audioSetting: '=',
			},
			template: '<div ng-bind-html="message"></div>',
			link: function(scope, elem, attrs) {
				scope.message = scope.msg.text;
				parse(scope.type)
					.then(function(view) {
						elem.append(view);
					}, errorHandler);

				// Metatype parsing
				function parse(type) {
					var q = $q.defer();
					switch (type) {
						case METATYPE.LINK:
							parseLink()
								.then(function(linkView) {
									$urlView.setContentObj(linkView);
									q.resolve($compile('<url-view></url-view>')(scope));
								}, function(err) {
									q.reject(err);
								});
							break;
						case METATYPE.IMG:
							parseImg();
							break;
						case METATYPE.MAP:
							break;
						case METATYPE.AUDIO:
							parseAudio();
							break;
						case METATYPE.VIDEO:
							parseVideo();
							break;
						case METATYPE.FILE:
							break;
						default:
							parseUnknown()
								.then(function(view) {
									q.resolve(view);
								}, function(err) {
									q.reject(err);
								});;
							break;
					}
					return q.promise;
				}

				function parseUnknown() {
					var q = $q.defer();
					var links = getLinks(scope.message);
					if (links) {
						parseLink(links)
							.then(function(linkView) {
								$urlView.setContentObj(linkView);
								q.resolve($compile('<url-view></url-view>')(scope));
							}, function(err) {
								q.reject(err);
							});
					} else if ( isImg(scope.msg.type) ) { //
						parseImg();
					} else if ( isAudio(scope.message) ) {
						parseAudio();
					} else if ( isVideo(scope.message) ) {
						parseVideo();
					}
					return q.promise;
				}

				// Appending the summary block after the links.
				function parseLink(links) {
					var q = $q.defer();
					var cacheView = {};
					angular.forEach(links, function(link) {
						if (link && link.match(/^http(s)?:\/\/.*/)) {
							scope.message = scope.message.replace(link, '<a href="'+link+'">'+link+'</a>');
							$http.get(link)
								.then(function(response) {
									var html = angular.element(response.data);
									angular.forEach(html, function(e) {
										if (e.tagName) {
											if (e.tagName == 'META' || e.tagName == 'LINK') {
												getMetaAttr(e, cacheView);
											} else if (e.tagName == 'TITLE') {
												if (!cacheView.title) {
													cacheView.title = e.innerText;
												}
											}
										}
									});
									q.resolve(cacheView);
								}, function(err) {
									q.reject(err);
								});
						}
					});
					return q.promise;
				}

				// Getting the useful meta attributes and assigning into the object.
				function getMetaAttr(meta, obj) {
					if (meta) {
						var property = meta.getAttribute('property') || meta.getAttribute('name') || meta.getAttribute('rel');
						var content = meta.getAttribute('content') || meta.getAttribute('href');
						switch (property) {
							case 'og:title':
							case 'twitter:title':
							case 'title':
								if (!obj.title) {
									obj.title = content;
								}
								break;
							case 'og:description':
							case 'twitter:description':
							case 'description':
								if (!obj.description) {
									obj.description = content;
								}
								break;
							case 'og:image':
							case 'twitter:image':
							case 'image':
							case 'img_src':
							case 'shortcut icon':
							case 'icon':
								if (!obj.image) {
									obj.image = content;
								}
								break;
							case 'og:url':
							case 'twitter:url':
							case 'url':
							case 'canonical':
								if (!obj.url) {
									// console.log('url property: '+property);
									// console.log('url content: '+content);
									obj.url = content;
								}
								break;
						}
					}
				}

				// Assuming the img uri provided.
				function parseImg() {
					scope.msg.isImg = true;
					console.log(ENV.GRIDFS_BASE_URL)
					scope.message = ENV.GRIDFS_BASE_URL+scope.message //
					console.log(scope.message)
					scope.message = '<img id="img'+scope.msg.id+'" src="'+scope.message+'">';
				}

				// Assuming the audio uri provided.
				function parseAudio() {
					scope.msg.isAudio = true;
					var audioUrl = scope.message;
					scope.message = '<img class="audio" src="'+scope.audioSetting.stop.img+'"><i class="icon ion-play"></i>';
					elem.bind('click', function() {
						scope.msg.isPlaying = !scope.msg.isPlaying;
						setView();
						
						if (scope.msg.isPlaying) {
							scope.audioSetting.play.fn(audioUrl)
								.then(function() {
									console.log('played');
									scope.msg.isPlaying = false;
									setView();
								});
						} else {
							scope.audioSetting.stop.fn();
						}

						function setView() {
							var img = elem.find('img');
							img[0].src = scope.msg.isPlaying ? scope.audioSetting.play.img : scope.audioSetting.stop.img;
							var icon = elem.find('i');
							icon[0].className = scope.msg.isPlaying ? scope.audioSetting.play.icon : scope.audioSetting.stop.icon;
						}
					});
				}

				function parseVideo() {
					scope.msg.isVideo = true;
					var videoUrl = scope.message;
					scope.message = '<video width="160" height="90"><source src="'+videoUrl+'"></video>';
				}

				// Output error logs
				function errorHandler(err) {
					console.error(err);
				}
			}
		};
	});

	/**
	 * WWW Trigger (What/Where/When)
	 *
	 * @support input, textarea.
	 *
	 * @note    If you use the trigger including space, like ' in ', make sure to include the ng-trim="false" to avoid the auto trimming from angular.
	 */
	jangularUI.directive('wwwTrigger', function($filter) {
		return {
			require: '^ngModel',
			restrict: 'A',
			scope: {
				wwwTrigger: '=',
				inputModel: '=ngModel'
			},
			link: function(scope, elem, attrs, ngModel) {
				// Break if invalid configurations.
				throwNotObj(scope.wwwTrigger);
				assignTrigger(scope.wwwTrigger);

				var _triggers = [];

				angular.forEach(scope.wwwTrigger, function(obj, key) {
					if (key !== 'trigger' && key !== 'invoke' && key !== 'watch') {
						// Break if invalid configurations.
						throwNotObj(obj);
						// Assigning the trigger and invoking function.
						assignTrigger(obj);
					}
				});

				scope.$watch('inputModel', myRender);

				function throwNotObj(input) {
					if (input && !angular.isObject(input)) {
						throw 'Invalid configuratoin for the directive "www-trigger", you should use an object like, { trigger: "@" }, or { when: { trigger: " in " } }, please see the documents on http://github.com/Jameshsiao/www-trigger.';
					}
				}
				function assignTrigger(obj) {
					var trigger = obj.trigger;
					// console.log(obj);
					if (trigger) {
						if (!obj.invoke) {
							console.warn('Trigger '+trigger+' will do nothing because the "invoke" function is not assigned.');
						}
						// If array, use all charaters to trigger all types.
						if ( angular.isArray(trigger) ) {
							angular.forEach(trigger, function(t) {
								_triggers.push({ trigger: t, invoke: obj.invoke || {} });
							});
						} else { // String, Numbers ...
							_triggers.push({ trigger: trigger, invoke: obj.invoke });
						}
					}
				}
				function filterInput(value) {
					if (value) {
						var filtered = $filter('filter')(_triggers, function(val, idx) {
							var startIdx = value.length - val.trigger.length;
							if (value.substr(startIdx) == val.trigger) {
								return true;
							}
						});
						return filtered[0] || null;
					}
				}
				function myRender(newVal, oldVal) {
					if (newVal !== oldVal) {
						var triggered = filterInput(ngModel.$modelValue);
						if (triggered) {
							ngModel.$rollbackViewValue();
							var callback = function(value) {
								console.log('callback');
								switch (triggered.display) {
									case 'icon':
										break;
									case 'link':
										break;
									// Default: show in text.
									default:
										if (angular.isDate(value)) {
											scope.inputModel += value.toLocaleDateString();
										} else {
											scope.inputModel += value.toString();
										}
										break;
								}
							};
							triggered.invoke(callback);
						}
					}
				}
			}
		};
	});

	/**
	 * Grid Menu
	 *
	 * @description  (Icon) menu in grid.
	 *
	 */
	jangularUI.directive('gridMenu', function($gridMenu) {
		return {
			restrict: 'EA',
			transclude: true,
			template: '<div class="menu-wrapper"><div class="grid-menu" ng-transclude></div></div>',
		};
	});
	jangularUI.factory('$gridMenu', function($http, $templateCache, $document, $compile, $timeout) {
		var _self = this;

		var _instances = [];

		_self.fromTemplateUrl = function(url, options) {
			return fetchTemplate(url).then(function(templateString) {
				return createMenu(templateString, options);
			});
		};

		function show() {
			var self = this;
			if (self.hasHeader) {
				angular.element(self.el.querySelector('.menu-wrapper')).addClass('has-header');
			}

			// Append to body if not present.
			if (!self.el.parentElement) {
				var body = $document.find('body').eq(0);
				body.append(self.el);
			}

			self.$el.css('display', 'block');
			self._isShown = true;

			self.$menu.addClass('ng-enter')
             		.removeClass('ng-leave ng-leave-active');

      $timeout(function() {
      	self.$menu.addClass('ng-enter-active');
      });

			return $timeout(function() {
        //After animating in, allow hide on backdrop click
        self.$el.on('click', function(e) {
          if (e.target === self.wrapper) {
            self.hide();
          }
        });
      }, 400);
		};
		function hide() {
			var self = this;

			self.$menu.addClass('ng-leave');

      $timeout(function() {
      	self.$menu.addClass('ng-leave-active')
      						.removeClass('ng-enter ng-enter-active');
      }, 20);

			self._isShown = false;

			return $timeout(function() {
        self.$el.removeClass('has-header');
				self.$el.css('display', 'none');
      }, self.hideDelay || 320);
		};
		function isShown() {
			return this._isShown;
		};

		function fetchTemplate(url) {
	    return $http.get(url, {cache: $templateCache})
	    .then(function(response) {
	      return response.data && response.data.trim();
	    });
	  }
	  function createMenu(templateString, options) {
	  	var scope = options.scope && options.scope.$new() || $rootScope.$new(true);
	  	var element = $compile(templateString)(scope);
	  	var wrapper = element[0].querySelector('.menu-wrapper');
	  	var menu = angular.element(wrapper.querySelector('.grid-menu'));

	  	var menu = {
	  		$el: element,
	  		el: element[0],
	  		wrapper: wrapper,
	  		$menu: menu,
	  		scope: scope,
	  		show: show,
	  		hide: hide,
	  		isShown: isShown,
	  		hasHeader: options.hasHeader || false
	  	};

	  	return menu;
	  }

		return _self;
	});

	/**
	 * Drawing
	 *
	 * @description Enable drawing on canvas.
	 *
	 * @acknowledge Thanks for JustGoscha shared the example code on http://stackoverflow.com/questions/16587961/is-there-already-a-canvas-drawing-directive-for-angularjs-out-there.
	 */
	jangularUI.directive('drawing', function() {
	  return {
	    restrict: 'A',
	    link: function(scope, elem) {
	      var ctx = elem[0].getContext('2d');

	      // variable that decides if something should be drawn on mousemove
	      var drawing = false;

	      // the last coordinates before the current move
	      var lastX;
	      var lastY;

	      elem.on('mousedown', function(event) {
	      	console.log('draw start');
	        if (event.offsetX !== undefined) {
	          lastX = event.offsetX;
	          lastY = event.offsetY;
	        } else { // Firefox compatibility
	          lastX = event.layerX - event.currentTarget.offsetLeft;
	          lastY = event.layerY - event.currentTarget.offsetTop;
	        }

	        // begins new line
	        ctx.beginPath();

	        drawing = true;
	      });
	      elem.on('mousemove', function(event) {

	        if (drawing) {
	        	console.log('draw moving');
	          // get current mouse position
	          if (event.offsetX !== undefined) {
	            currentX = event.offsetX;
	            currentY = event.offsetY;
	          } else {
	            currentX = event.layerX - event.currentTarget.offsetLeft;
	            currentY = event.layerY - event.currentTarget.offsetTop;
	          }

	          scope.$apply(function() {
	          	draw(lastX, lastY, currentX, currentY);
	          });

	          // set current coordinates to last one
	          lastX = currentX;
	          lastY = currentY;
	        }

	      });
	      elem.on('mouseup', function(event) {
	      	console.log('draw end');
	        // stop drawing
	        drawing = false;
	      });

	      // canvas reset
	      function reset() {
	       	elem[0].width = elem[0].width; 
	      }

	      function draw(lX, lY, cX, cY) {
	        // line from
	        ctx.moveTo(lX,lY);
	        // to
	        ctx.lineTo(cX,cY);
	        // color
	        ctx.strokeStyle = "#4bf";
	        // draw it
	        ctx.stroke();
	      }
	    }
	  };
	});

	/**
	 * Url View
   *
   */
  jangularUI.directive('urlView', function($urlView, $compile) {
  	return {
  		restrict: 'EA',
  		scope: {
  			contentObj: '=',
  		},
  		template: '<a class="url-view" href="{{ ::content.url }}">'+
  								'<img src="{{ ::content.image }}" ng-if="::content.image">'+
  								'<h5 class="title" ng-bind-html="::content.title"></h5>'+
  								'<p class="descript" ng-bind-html="::content.description"></p>'+
  								'<div class="comment">{{ ::content.comment }}</div>'+
	  						'</a>',
  		link: function(scope, elem, attrs) {
  			scope.content = scope.contentObj || $urlView.getContentObj();
  			var noScheme = scope.content.url.replace(/(http|ftp|https):\/\//gi, '');
  			if (noScheme.lastIndexOf('/') >= 0) {
  				scope.content.comment = noScheme.substring(0, noScheme.lastIndexOf('/'));
  			} else {
  				scope.content.comment = noScheme;
  			}
  		}
  	}
  });
  // Service of url-view
  jangularUI.factory('$urlView', function() {
  	var _self = this;
  	var _content = null;

  	_self.getContentObj = function() {
  		return _content;
  	};
  	_self.setContentObj = function(obj) {
  		_content = obj;
  	};

  	return _self;
  });

  // Service of type
  jangularUI.factory('$checkFormat', function() {
  	var _self = this;

  	_self.isImg = isImg;
  	
  	return _self;
  });

  // Constants
  jangularUI.constant('METATYPE', METATYPE);

	return jangularUI;
})();