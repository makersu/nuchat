/**
 *  (Partial) Jangular UI directives
 *  @author   James Hsiao
 *  @lib      Ionic App Labs
 *
 *  Include:
 *  1)  Meta-Message
 *  2)  WWW Trigger
 *  3)  Grid Menu
 *  4)  In View Window
 *  5)  Url(link) View
 *  6)  Collapse Buttons
 *  7)  Flip Item
 *  8)  Image Viewer
 *  9)  Center Image
 *  10) Rich Article
 *  11) Side Panel
 */
(function() {
	var jangularUI = angular.module('jangular.ui', ['Nuchatapp.configs']);

	var METATYPE = {
		LINK:  	  'link',
		IMG: 			'image',
		AUDIO:    'audio',
		VIDEO:    'video',
		ARTICLE:  'article',
		CALENDAR: 'calendar',
		MAP:      'map',
		FILE:     'file', // Including documents?
		UNKNOWN:  'unknown',
	};

	var FOLDING_LINE_THRES = 5;
	var FOLDING_CHAR_THRES = 256;

	function getLinks(content) {
		if (content) {
			return content.toLowerCase().match(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:\/~\+#]*[\w\-\@?^=%&amp;\/~\+#])?/);			
		}
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
						// console.log(content);
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

	function parseSummaryLink(link, obj, $http) {
		var promise = null;
		if (link && link.match(/^http(s)?:\/\/.*/)) {
			promise = $http.get(link, {cache: true})
				.then(function(response) {
					var parser = new DOMParser();
					var head = angular.element( parser.parseFromString(response.data, "text/html") ).find('head');
					// var html = angular.element(response.data);
					angular.forEach(head.children(), function(e) {
						if (e.tagName) {
							if (e.tagName == 'META' || e.tagName == 'LINK') {
								getMetaAttr(e, obj);
							} else if (e.tagName == 'TITLE') {
								if (!obj.title) {
									obj.title = e.innerText;
								}
							}
						}
					});
					if (!obj.url) {
						obj.url = link;
					}
					if (!obj.image) {
						obj.image = obj.url+(obj.url.lastIndexOf('/') === (obj.url.length-1) ? '' : '/')+'favicon.ico';
					} else if (obj.image.indexOf('/') == 0 || obj.image.indexOf('http') != 0) {
						obj.image = obj.url+(obj.image.indexOf('/') === 0 ? '' : '/')+obj.image;
					}
					return obj;
				}, function(err) {
					return err;
				});
		}
		return promise;
	}

	function isIOS() {
		return device.platform == 'iOS';
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

	function checkType(toCheck, type) {
		if (toCheck && toCheck.indexOf(type) != -1) {			
				return true;
		}
		return false;
	}

	function isImg(contentType) {
		return checkType(contentType, 'image');
	}

	function isAudio(contentType) {
		return checkType(contentType, 'audio');
		// if (content) {
		// 	var ext = content.substr(content.lastIndexOf('.'));
		// 	if ( ext.match(/3gp|3gpp|mp3|ogg|wav|m4a|m4b|m4p|m4v|m4r|aac/) ) {
		// 		return true;
		// 	}
		// }
		// return false;
	}

	function isVideo(contentType) {
		return checkType(contentType, 'video');
		// if (content) {
		// 	var ext = content.substr(content.lastIndexOf('.'));
		// 	if ( ext.match(/ogg|mp4|webm/) ) {
		// 		return true;
		// 	}
		// }
		// return false;
	}

	function requestFullScreen(elem) {
		if (elem.requestFullscreen) {
		  elem.requestFullscreen();
		} else if (elem.msRequestFullscreen) {
		  elem.msRequestFullscreen();
		} else if (elem.mozRequestFullScreen) {
		  elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) {
		  elem.webkitRequestFullscreen();
		}
	}
	function exitFullScreen(elem) {
		if (elem.exitFullscreen) {
		  Document.exitFullscreen();
		} else if (elem.msExitFullscreen) {
		  elem.msExitFullscreen();
		} else if (elem.mozCancelFullScreen) {
		  elem.mozCancelFullScreen();
		} else if (elem.webkitExitFullscreen) {
		  Document.webkitExitFullscreen();
		}
	}

	function swap(a, b) {
		var temp = a;
		a = b;
		b = temp;
	}

	jangularUI.factory('$jgTemplate', ['$http', '$templateCache', function($http, $templateCache) {
		var _service = {};
		_service.fetchTemplate = function(url) {
			return $http.get(url, {cache: $templateCache})
		    .then(function(response) {
		      return response.data && response.data.trim();
		    });
		  };
		return _service;
	}]);

	/**
	 * Meta Message
	 * 
	 * @support
	 * 1) Hyper-link
	 * 2) Image: jpg|jpeg|png|bmp|gif|tiff|tif|svg
	 * 3) Audio: 3gp|3gpp|mp3|ogg|wav|m4a|m4b|m4p|m4v|m4r|aac|mp4
	 * 4) Video: ogg|mp4|webm (HTML 5 Video supports)
	 */
	jangularUI.directive('metaMsg', function($http, $rootScope, $q, $compile, $urlView, $filter, $location, $ionicScrollDelegate, $sce, $timeout) {
		return {
			restrict: 'EA',
			scope: {
				msg: '=',
				type: '=',
				metaOption: '=',
				scrollHandle: '@',
			},
			template: '<div class="content" id="{{ ::msg.id }}"></div>\
								 <a class="extend" ng-if="hasMore && !extended" ng-click="extend()">...{{ ::\'MORE\' | translate }}</a>\
								 <a class="extend" ng-if="extended" ng-click="hide()">...{{ ::\'LESS\' | translate }}</a>\
								 <div class="tags" ng-if="notLink()"><span class="badge" ng-repeat="tag in msg.tags | limitTo:5">{{ tag }}</span><span ng-if="msg.tags.length > 5">...</span></div>',
			link: function(scope, elem, attrs) {
				var _audioSetting = scope.metaOption.audioSetting || {};
				var _foldingThres = scope.metaOption.foldingThres || FOLDING_LINE_THRES;
				var _linkSetting = scope.metaOption.linkSetting || {};
				var _remoteSrv = scope.metaOption.remote || ''; // Empty if use the local file for development...
				var _originMsg = scope.message = scope.msg.text;
				var _msgContent = elem.find('div');
				var _scrollHandle = $ionicScrollDelegate.$getByHandle(scope.scrollHandle);

				parse(scope.type);

				// Registering events.
				scope.$on('uploaded', function(event, args) {
					if (scope.msg.roomId === args.msg.roomId && scope.msg.ownerId === args.msg.ownerId) {
						if (args.msg.timestamp === scope.msg.timestamp) {
							// console.log(args.msg);
							// console.log(scope.msg);
							scope.msg.uploading = false;
							$rootScope.$broadcast('updateObjMsg', { msg: args.msg });
						}
					}
				});

				scope.extend = function() {
					scope.extended = true;
					scope.message = $filter('nl2br')(_originMsg);
					_msgContent.html('').append(scope.message);
				};
				scope.hide = function() {
					scope.extended = false;
					scope.message = _originMsg;
					parseText();
		      $location.hash(scope.msg.id);
		      _scrollHandle.anchorScroll();
				};
				scope.linkClickHandler = function(link) {
					console.log(scope.msg.text);
					_linkSetting.clickHandler && _linkSetting.clickHandler(link || scope.msg.text);
				};
				scope.notLink = function() {
					return scope.msg.type && scope.msg.type !== METATYPE.LINK || !scope.msg.type;
				};

				// Metatype parsing
				function parse(type) {
					switch (type) {
						case METATYPE.LINK:
							parseLink();
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
							parseUnknown();
							break;
					}
				}

				function parseUnknown() {
					var q = $q.defer();
					var links = getLinks(scope.message);
					if (links) {
						parseLink(links);
					} else if ( isImg(scope.msg.type) ) { //
						parseImg();
					} else if ( isAudio(scope.msg.type) ) {
						parseAudio();
					} else if ( isVideo(scope.msg.type) ) {
						parseVideo();
					} else {
						parseText();
					}
					return q.promise;
				}

				// Appending the summary block after the links.
				function parseLink(links) {
					// console.log(links);
					// var q = $q.defer();
					var cacheView = { id: scope.msg.id };
					scope.msg.type = METATYPE.LINK;
					angular.forEach(links, function(link) {
						var promise = parseSummaryLink(link, cacheView, $http);
						if (promise) {
							promise.then(function(result) {
								scope.message = scope.message.toLowerCase().replace(link, '<a ng-click="linkClickHandler(\''+link+'\')">'+link+'</a>');
								$compile(_msgContent.html('').append(scope.message))(scope);
								scope.msg.linkView = result;
								elem.append( $compile('<url-view class="img-left brief" content-obj="msg" click-handler="linkClickHandler"></url-view>')(scope) );
							}, errorHandler);
						}
						// if (link && link.match(/^http(s)?:\/\/.*/)) {
						// 	scope.message = scope.message.replace(link, '<a href="'+link+'">'+link+'</a>');
						// 	$http.get(link)
						// 		.then(function(response) {
						// 			var html = angular.element(response.data);
						// 			angular.forEach(html, function(e) {
						// 				if (e.tagName) {
						// 					if (e.tagName == 'META' || e.tagName == 'LINK') {
						// 						getMetaAttr(e, cacheView);
						// 					} else if (e.tagName == 'TITLE') {
						// 						if (!cacheView.title) {
						// 							cacheView.title = e.innerText;
						// 						}
						// 					}
						// 				}
						// 			});
						// 			if (!cacheView.url) {
						// 				cacheView.url = link;
						// 			}
						// 			if (!cacheView.image) {
						// 				cacheView.image = cacheView.url+'/favicon.ico';
						// 			} else if (cacheView.image.indexOf('/') == 0 || cacheView.image.indexOf('http') != 0) {
						// 				cacheView.image = cacheView.url+'/'+cacheView.image;
						// 			}
						// 			q.resolve(cacheView);
						// 		}, function(err) {
						// 			q.reject(err);
						// 		});
						// }
					});
					// return q.promise;
				}

				// Assuming the img uri provided.
				function parseImg() {
					console.log('parseImg');
					// scope.msg.type = METATYPE.IMG;
					scope.msg.isImg = true;
					var imgSrc = scope.msg.thumbnailFileId ? _remoteSrv+scope.msg.thumbnailFileId : scope.message;
					scope.msg.uploading = !scope.msg.thumbnailFileId;
					console.log('parseImg uploading? '+scope.msg.uploading);
					console.log(scope.msg);
					var $imgElem = angular.element('<img id="img'+scope.msg.id+'" src="'+imgSrc+'">');
					_msgContent.append($imgElem).append( $compile('<ion-spinner ng-if="msg.uploading"></ion-spinner>')(scope) );
					$imgElem.on('click', scope.metaOption.imgSetting.clickHandler ? function() {
						scope.metaOption.imgSetting.clickHandler(scope.msg.id || scope.msg.timestamp);
					} : {});
				}

				// Assuming the audio uri provided.
				function parseAudio() {
					// TODO: if audioSetting is not set, throw the error message.
					// scope.msg.type = METATYPE.AUDIO;
					var audioUrl = scope.msg.originalFileId ? _remoteSrv+scope.msg.originalFileId : scope.message;//
					scope.msg.uploading = !scope.msg.originalFileId;

					// scope.message = '<img class="audio" src="'+_audioSetting.stop.img+'"><i class="icon ion-play"></i>';
					// _msgContent.append( $compile('<img class="audio" src="'+_audioSetting.stop.img+'"><i class="icon ion-play"></i><ion-spinner icon="lines" ng-if="msg.uploading"></ion-spinner>' )(scope) );
					_msgContent.append( $compile('<audio src="'+audioUrl+'" controls></audio><ion-spinner icon="lines" ng-if="msg.uploading"></ion-spinner>' )(scope) );
					// elem.bind('click', function() {
					// 	scope.msg.isPlaying = !scope.msg.isPlaying;
					// 	setView();
						
					// 	if (scope.msg.isPlaying) {
					// 		_audioSetting.play.fn(audioUrl)
					// 			.then(function() {
					// 				// console.log('played');
					// 				scope.msg.isPlaying = false;
					// 				setView();
					// 			});
					// 	} else {
					// 		_audioSetting.stop.fn();
					// 	}

					// 	function setView() {
					// 		var img = elem.find('img');
					// 		img[0].src = scope.msg.isPlaying ? _audioSetting.play.img : _audioSetting.stop.img;
					// 		var icon = elem.find('i');
					// 		icon[0].className = scope.msg.isPlaying ? _audioSetting.play.icon : _audioSetting.stop.icon;
					// 	}
					// });
				}

				function parseVideo() {
					// scope.msg.type = METATYPE.VIDEO;
					var videoUrl = scope.msg.originalFileId ? _remoteSrv+scope.msg.originalFileId : scope.message;//
					var thumbnailUrl = scope.msg.thumbnailFileId ? _remoteSrv+scope.msg.thumbnailFileId : scope.message;
					scope.msg.uploading = !scope.msg.originalFileId;
					var $videoElem = angular.element('<video class="video-thumb" poster="'+thumbnailUrl+'"><source src="'+videoUrl+'"></video>');
					// $videoElem.on('loadeddata', function() {
					// 	$videoElem[0].currentTime = 1;
					// 	console.log('video loadeddata');
					// 	console.log($videoElem[0].duration);
					// 	console.log($videoElem[0].currentTime);
					// });
					$videoElem.on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {
				    var isFullscreen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
				    if (isFullscreen) {
							$videoElem.attr('controls', 'controls');
				    	$playBtn.css('opacity', '0');
				    } else {
							$videoElem.removeAttr('controls');
							$playBtn.css('opacity', '1');
				    }
					});
					// $videoElem[0].src = videoUrl;
					var $playBtn = angular.element('<i class="icon ion-play"></i>');
					$playBtn.on('click', function() {
						if ($videoElem[0].paused) {
							$videoElem[0].play();
							requestFullScreen($videoElem[0]);
						} else {
							$videoElem[0].pause();
							exitFullScreen($videoElem[0]);
						}
					});
					_msgContent.append($videoElem);
					if (!isIOS()) {
						_msgContent.append($playBtn);
					}
					_msgContent.append($compile('<ion-spinner icon="crescent" ng-if="msg.uploading"></ion-spinner>')(scope));
				}

				function parseText() {
					var text = scope.message;
					var lines = scope.message.split('\n');
					if (lines.length > _foldingThres || scope.message.length > FOLDING_CHAR_THRES) {
						text = '';
						for (var i = 0; i < lines.length && i < _foldingThres && text.length < FOLDING_CHAR_THRES; i++) {
							text += lines[i]+'<br>';
						}
						text = text.substring(0, text.length-4);
						if (text.length > FOLDING_CHAR_THRES) text = text.substr(0, FOLDING_CHAR_THRES);
						scope.hasMore = true;
						// scope.message = text;
					}
					_msgContent.html('').append(text);
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
	jangularUI.factory('$gridMenu', function($jgTemplate, $document, $compile, $timeout) {
		var _self = this;

		var _instances = [];

		_self.fromTemplateUrl = function(url, options) {
			return $jgTemplate.fetchTemplate(url).then(function(templateString) {
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

		/**
     * @ngdoc method
     * @name gridMenu#remove
     * @description Remove this gridMenu instance from the DOM and clean up.
     * @returns {promise} A promise which is resolved when the gridMenu is finished animating out.
     */
    function remove() {
      var self = this;
      self.scope.$parent && self.scope.$parent.$broadcast(self.viewType + '.removed', self);

      return self.hide().then(function() {
        self.scope.$destroy();
        self.$el.remove();
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
	  		remove: remove,
	  		hasHeader: options.hasHeader || false
	  	};

	  	return menu;
	  }

		return _self;
	});

	/**
	 *  Page Collection
	 *
	 *  @description  Auto hide/show when element outside/inside the view window.
	 *
	 */
	// var DEFAULT_RENDER_BUFFER = 5;
	var DEFAULT_PAGE_SIZE = 10;
	var DEFAULT_DISTANCE = '2.5%';
	var SCROLL_THRESHOLD = 20;
	var PRIMARY = 'PRIMARY';
  var SECONDARY = 'SECONDARY';
  var TRANSLATE_TEMPLATE_STR = 'translate3d(SECONDARYpx,PRIMARYpx,0)';
	jangularUI.directive('pageCollection', ['$parse', '$$rAF', '$rootScope', '$filter', '$timeout', function($parse, $$rAF, $rootScope, $filter, $timeout) {
		return {
			restrict: 'A',
			transclude: 'element',
			require: '^^$ionicScroll',
			link: function(scope, elem, attrs, scrollCtrl, transclude) {
				var $container = elem.parent();
				var scrollView = scrollCtrl.scrollView;
				if (scrollView.options.scrollingX && scrollView.options.scrollingY) {
		      throw new Error("collection-repeat expected a parent x or y scrollView, not " +
		                      "an xy scrollView.");
		    }

				var expression = attrs.pageCollection;
				var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+inside\s+([\s\S]+?))?\s*$/);
				if (!match) {
		      throw new Error("page-collection expected expression in form of '_item_ in " +
		                      "_collection_[ inside _selector_]' but got '" + attr.pageCollection + "'.");
		    }
				// console.log(match);
				var itemKeyExpr = match[1];
				var collection = match[2];
				var data = [];
				var renderedElements = [];
				var itemsLeaving = [];
				var itemsEntering = [];
				var postRendering = [];
				var itemsPool = [];
				var distance = (attrs.distance || DEFAULT_DISTANCE).trim();
				var isPercent = distance.indexOf('%') !== -1;
				// var itemsGetter = $parse(collection);
				var winEl = angular.element(document.querySelector(match[3]));
				var viewWin = verge.rectangle(winEl[0], 10);

				var forceRender = false;
				var renderPageExpr = attrs.pageSize;
				var renderPageSize = angular.isDefined(renderPageExpr) ?
		      parseInt(renderPageExpr) : DEFAULT_PAGE_SIZE;
		    var currentPage = 0;
		    var totalPages = 0;
		    var renderStartIndex = 0;
				var renderEndIndex = renderStartIndex+renderPageSize;
				var currentPageStart = currentPageEnd = 0;
				var currentPageStartIndex = currentPageEndIndex = 0;
				var leavingHeight = enteringHeight = 0;
				var oldTransformTop = 0;

				// function isInViewWindow() {
				// 	var elRect = verge.rectangle(elem[0]);
				// 	return (elRect.top > viewWin.top && elRect.top < viewWin.bottom || elRect.bottom > viewWin.top && elRect.bottom < viewWin.bottom)
				// 		&& (elRect.left > viewWin.left && elRect.left < viewWin.right || elRect.right > viewWin.left && elRect.right < viewWin.right);
				// }
				function getRect(elem) {
					return verge.rectangle(elem);
				}
				// determine pixel refresh distance based on % or value
			  function calculateThreshold(maximum) {
			    return {
			    	min: isPercent ?
			    		maximum * parseFloat(distance) / 100 :
			    		parseFloat(distance),
			    	max: isPercent ?
					    maximum * (1 - parseFloat(distance) / 100) :
					    maximum - parseFloat(distance)
					};
			  }
			  function dataChangeRequiresRefresh(newData) {
			  	var requiresRefresh = newData.length > 0 || newData.length < data.length;
			  	return !!requiresRefresh;
			  }
			  function RepeatItem() {
			  	var self = this;
		      this.scope = scope.$new();
		      transclude(this.scope, function(clone) {
		        self.el = clone[0];
		        // TODO destroy
		        // Batch style setting to lower repaints
        		self.el.style[ionic.CSS.TRANSFORM] = 'translate3d(-9999px,-9999px,0)';
		        ionic.Utils.disconnectScope(self.scope);
		        $container.append(self.el);
						renderedElements.push(self);
		      });
			  }

			  function render() {
			  	if (!data.length) return;
			  	var item, scope, i;
					leavingHeight = enteringHeight = 0;
			  	renderStartIndex = Math.max(0, renderStartIndex - renderPageSize);
			  	renderEndIndex = Math.min(data.length - 1, renderEndIndex + renderPageSize);
			  	currentPageStartIndex = Math.max(0, renderStartIndex - renderPageSize);
			  	currentPageEndIndex = Math.min(data.length - 1, currentPageStartIndex + renderPageSize);
			  	console.log('start: '+renderStartIndex);
			  	console.log('end: '+renderEndIndex);

			  	console.log(renderedElements);
			  	for (i in renderedElements) {
			  		// console.log(i);
		        if (i < renderStartIndex || i > renderEndIndex) {
		          item = renderedElements[i];
		          delete renderedElements[i];
		          itemsLeaving.push(item);
		          item.isShown = false;
		        }
		      }
			  	console.log(itemsLeaving);

			  	updateCurrentDimension(currentPageStartIndex, currentPageEndIndex);
			  	console.log('currentPageStart: '+currentPageStart);
			  	console.log('currentPageEnd: '+currentPageEnd );
			  	if (!currentPageStart && !currentPageEnd) forceRender = true;
			  	console.log(forceRender);
			  	console.log('currentPageStartIndex: '+currentPageStartIndex+', currentPageEndIndex: '+currentPageEndIndex);

			  	for (i = renderStartIndex; i < renderEndIndex; i++) {
						if (i >= data.length || renderedElements[i]) continue;

						console.log('append item');
						item = renderedElements[i] || ( renderedElements[i] = itemsLeaving.length ? itemsLeaving.pop() :
					                                      itemsPool.length ? itemsPool.shift() :
					                                      new RepeatItem() );
						itemsEntering.push(item);
        		item.isShown = true;
						scope = item.scope;
						scope.$index = i;
						scope[itemKeyExpr] = data[i];
						scope.$first = (i === 0);
		        scope.$last = (i === (data.length - 1));
		        scope.$middle = !(scope.$first || scope.$last);
		        scope.$odd = !(scope.$even = (i&1) === 0);

		        if (scope.$$disconnected) ionic.Utils.reconnectScope(item.scope);
		        console.log(item.scope);
		        console.log(item.el);
		        console.log(item.el.offsetHeight);
		        console.log(getRect(item.el));
		        console.log(scrollCtrl.getScrollPosition());
		        console.log(scrollView.__scrollTop);

						// transclude(itemScope, function(clone) {
						// 	// console.log(clone);
						// 	// console.log(itemKeyExpr);
						// 	// console.log(itemsGetter(scope));
						// 	// console.log(collection);
						// 	// console.log(eval('scope.'+collection));
						// 	// console.log($compile(clone)(itemScope));
						// 	elem.parent().append(clone);
						// 	elements.push({el: clone, scope: itemScope});
						// 	// ionic.Utils.disconnectScope(itemScope);
						// });
					}

					while (itemsLeaving.length) {
		        item = itemsLeaving.pop();
		        console.log('From leaving');
						console.log(item);
						leavingHeight += item.el.offsetHeight;
						console.log('leavingHeight: '+leavingHeight);
		        ionic.Utils.disconnectScope(item.scope);
		        itemsPool.push(item);
		      }
					console.log('leavingHeight: '+leavingHeight);

		      digestEnteringItems();

		      // renderedElements = $filter('orderBy')(renderedElements, 'id');
			  }

			  function updateCurrentDimension(startIdx, endIdx) {
			  	renderedElements[startIdx] && (function() {
			  		var startTop = verge.rectangle(renderedElements[startIdx].el).top;
			  		startTop > 0 && (currentPageStart = startTop || 0);
			  	})();
			  	renderedElements[endIdx] && (function() {
			  		var endTop = verge.rectangle(renderedElements[endIdx].el).top;
			  		endTop > 0 && (currentPageEnd = verge.rectangle(renderedElements[endIdx].el).top || 0);
			  	})();
			  	console.log(currentPageStart);
			  	console.log(currentPageEnd);
			  }

			  function getDimension(index, pivotIndexStart, pivotIndexEnd) {
			  	var isPrev = index-pivotIndexStart < 0;
			  	var primaryHeight = 0;
			  	if (isPrev) {
			  		for (var i = index; i < pivotIndexStart; i++) {
				  		primaryHeight += renderedElements[i].el.offsetHeight;
				  	}
			  		return currentPageStart-primaryHeight;
			  	} else {
			  		var start = index > pivotIndexEnd ? pivotIndexEnd : pivotIndexStart;
			  		console.log(renderedElements);
			  		console.log(pivotIndexEnd);
			  		console.log(index);
			  		for (var i = start; i < index; i++) {
			  			console.log(renderedElements[i]);
			  			console.log('renderedElements['+i+'].el.offsetHeight: '+renderedElements[i].el.offsetHeight);
			  			primaryHeight += renderedElements[i].el.offsetHeight;
			  			console.log('primaryHeight: '+primaryHeight);
			  		}
			  		// do {
			  		// 	console.log(renderedElements[i]);
			  		// 	console.log('renderedElements['+i+'].el.offsetHeight: '+renderedElements[i].el.offsetHeight);
			  		// 	primaryHeight += renderedElements[i].el.offsetHeight;
			  		// 	console.log('primaryHeight: '+primaryHeight);
			  		// 	i++;
			  		// } while(i < index);
			  		console.log('primaryHeight( plus currentPageEnd): '+(currentPageEnd+primaryHeight) );
			  		return currentPageEnd+primaryHeight;
			  	}
			  }

			  function digestEnteringItems() {
		      var item;
		      if (digestEnteringItems.running) return;
		      digestEnteringItems.running = true;

		      $$rAF(function process() {
		        var rootScopePhase = $rootScope.$$phase;
		        console.log('itemsEntering:');
		        console.log(itemsEntering);
		        while (itemsEntering.length) {
		          item = itemsEntering.pop();
		          postRendering.push(item);
		          if (item.isShown) {
		            if (!rootScopePhase) {
		            	item.scope.$digest();
		            }
		          }
		        }
		        $timeout(function() {
		        	while (postRendering.length) {
		        		item = postRendering.pop();
		        		console.log('item['+item.scope.$index+'] offsetHeight: '+item.el.offsetHeight);
					  		item.el.style[ionic.CSS.TRANSFORM] = TRANSLATE_TEMPLATE_STR
		            	.replace(PRIMARY, getDimension(item.scope.$index, currentPageStartIndex, currentPageEndIndex))
		            	.replace(SECONDARY, 0);
				        console.log(item.el.style[ionic.CSS.TRANSFORM]);
	            	// debugger;

	            	if (forceRender) {
				        	updateCurrentDimension(currentPageStartIndex, currentPageEndIndex);
				        	console.log('currentPageStart: '+currentPageStart);
					  			console.log('currentPageEnd: '+currentPageEnd );
				        }

	            	console.log('To entering');
								console.log(item);
								enteringHeight += item.el.offsetHeight;
								console.log('enteringHeight: '+enteringHeight);
		        	}
          	}, 100);
		        // Scrolling to original position
						scrollCtrl.resize();
		        digestEnteringItems.running = false;
		      });
		    }

	      var checkBound = _.debounce(function() {
					var thresholds = calculateThreshold(scrollView.getScrollMax().top);
					if (scrollView.__scrollTop >= thresholds.min && scrollView.__scrollTop <= thresholds.max) return;

					if (scrollView.__scrollTop < thresholds.min) {
						currentPage = Math.max(0, currentPage - 1);
					} else if (scrollView.__scrollTop > thresholds.max) {
						currentPage = Math.min(totalPages - 1, currentPage + 1);
						console.log('renderStartIndex: '+renderStartIndex);
						console.log('renderEndIndex: '+renderEndIndex);
					}
					renderStartIndex = currentPage * renderPageSize;
					renderEndIndex = renderStartIndex + renderPageSize;
					render();
				}, 300);

				console.log('scrollView');
				console.log(scrollView);
				console.log(scrollCtrl);
    		scrollView.__$callback = scrollView.__callback;
				scrollView.__callback = function(transformLeft, transformTop, zoom, wasResize) {
					console.log('scrolling callback');
					console.log(transformTop);
					// console.log('scrolling');
					// console.log(scrollView.__scrollTop);
					if (Math.abs(transformTop-oldTransformTop) > SCROLL_THRESHOLD) {
						checkBound();
					}
      		scrollView.__$callback(transformLeft, transformTop, zoom, wasResize);
      		oldTransformTop = transformTop;
				};

				scope.$watchCollection(collection, function(newVal) {
					if ( newVal && dataChangeRequiresRefresh(newVal) ) {
						data = angular.isArray(newVal) ? newVal : _.values(newVal);
					}
					console.log(data);
					// check if elements have already been rendered
          // if (renderedElements.length > 0){
          //   // if so remove them from DOM, and destroy their scope
          //   for (var i = 0; i < renderedElements.length; i++) {
          //     renderedElements[i].$el.remove();
          //     renderedElements[i].scope.$destroy();
          //   };
          //   renderedElements = [];
          // }

          totalPages = Math.ceil(data.length / renderPageSize);
          render();
				});
				// winEl.on('scroll', onScroll);
				scrollCtrl.scrollTop();

				scope.$on('$destroy', function() {
					// winEl.off('scroll', onScroll);
				})
			}
		};
	}]);

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
	 * Collapse Buttons
	 *
	 * @description  Floating buttons with collapse/expand animations.
	 *
	 */
	jangularUI.directive('collapseButtons', function($compile, $timeout) {
		return {
			restrict: 'E',
			transclude: true,
			template: '<div class="buttons-wrapper" ng-transclude></div>',
			link: function(scope, elem, attrs) {
				var classes = attrs.class;
				var floatOptions = attrs.float ? attrs.float.split(' ') : ['bottom', 'right'];
				scope.isExpanded = false;

				var wrapper = elem.find('div');
				var actionBtns = wrapper.children();
				var mainBtn = angular.element('<a class="button button-float icon fa fa-cogs"></a>');

				// Assigning the custom classes.
				if (classes) {
					elem.addClass('collapse-buttons '+classes);
					mainBtn.addClass(classes);
				}
				// Assigning the float option classes. DEFAULT: float bottom and right
				angular.forEach(floatOptions, function(opt) {
					elem.addClass('float-'+opt);
				});
				// Initializing the action buttons.
				angular.forEach(actionBtns, function(btn) {
					var btnElm = angular.element(btn);
					var ngIf = 'isExpanded';
					if (btnElm.attr('collapse-if')) {
						ngIf += ' && '+btnElm.attr('collapse-if');
					}
					console.log(ngIf);
					btnElm.attr('ng-if', ngIf);
					$compile(btnElm)(scope);
				});

				// Binding the expand function to the main button.
				mainBtn.on('click', function(event) {
					event.stopPropagation();
					if (!scope.isExpanded) {
						expanding();
					} else {
						collapsing();
					}
				});
				// Binding the click event to collapse the buttons.
				elem.on('click', function() {
					collapsing();
				});

				// Adding the main button into the view.
				wrapper.append(mainBtn);

				function assignExpand(opt) {
					switch (opt) {
						case 'bottom':
							animateTo('top');
							break;
						case 'right':
							animateTo('left');
							break;
						case 'top':
							animateTo('bottom');
							break;
						case 'left':
							animateTo('right');
							break;
					}
				}
				function animateTo(dir) {
					var btns = elem[0].querySelectorAll('.button-float[expand-to="'+dir+'"]');
					angular.forEach(btns, function(btn, idx) {
						if (scope.isExpanded) {
							angular.element(btn).addClass('expand expand-'+dir+'-'+(idx+1) );
						} else {
							angular.element(btn).removeClass('expand expand-'+dir+'-'+(idx+1) );
						}
					});
				}
				function expanding() {
					scope.isExpanded = true;
					scope.$apply();
					$timeout(function() {
						angular.forEach(floatOptions, function(opt) {
							assignExpand(opt);
							elem.css({'width':'100%', 'height':'100%'});
						});
					}, 50);
				}
				function collapsing() {
					scope.isExpanded = false;
					elem.css({'width':'initial', 'height':'initial'});
					angular.forEach(floatOptions, function(opt) {
						assignExpand(opt);
					});
					$timeout(function() {
						scope.$apply();
					}, 190);
				}
			}
		};
	});

	/**
	 * Flip Item
	 *
	 * @description  item container with the front/back faces switched by custom event.
	 *
	 */
	jangularUI.directive('flipItem', function($ionicGesture) {
		return {
			restrict: 'E',
			replace: true,
			transclude: true,
			scope: {
				isFlipped: '=?'
			},
			template: '<div class="flip-container">'+
									'<div class="flip-item" ng-class="{\'flipped\': isFlipped}" ng-transclude></div>'+
								'</div>',
			link: function(scope, elem, attrs) {
				var flipEvent = attrs.flipEvent || 'hold';
				var $flipItem = angular.element(elem[0].querySelector('.flip-item'));
				var flipping = function(event) {
					scope.$apply(function() {
						scope.isFlipped = !scope.isFlipped;
					});
				};

				if (!ionic) throw 'Flip Item requires the Ionic framework!!';
				$ionicGesture.on(flipEvent, flipping, $flipItem);
			}
		};
	});

	/**
	 * Image Viewer
	 */
	jangularUI
		.directive('imageViewer', ['$ionicSlideBoxDelegate', '$ionicScrollDelegate', '$filter', '$imageViewer', '$timeout',
			function($ionicSlideBoxDelegate, $ionicScrollDelegate, $filter, $imageViewer, $timeout) {

				return {
					restrict: 'E',
					template: '<ion-modal-view class="image-viewer transparent hello">'+
											'<ion-slide-box auto-play="false" active-slide="initIndex" does-continue="true" on-slide-changed="slideChanged($index)" delegate-handle="slideHandle">'+
												'<ion-slide ng-repeat="img in viewList">'+
												  '<ion-scroll zooming="true" min-zoom="1" direction="xy" style="height:100%" delegate-handle="imgViewerScrollHandle{{$index}}" on-scroll="onImageScroll($event)">'+
												    '<div class="img-container">'+
												      '<img ng-src="{{ img.src }}" lazy-load="lazyLoadFn(img)">'+
												    '</div>'+
												  '</ion-scroll>'+
												'</ion-slide>'+
											'</ion-slide-box>'+
										  '<a class="close" ng-click="close()">{{ ::"CLOSE" | translate }}</a>'+
										'</ion-modal-view>',
					link: function($scope, $elem, $attrs) {
						var prevIdx = $scope.initIndex;
						// $scope.imgList = $scope[$attrs.imgList] || [];
						$scope.onImageScroll = onImageScroll;
						$scope.slideChanged = slideChanged;
						$scope.close = $imageViewer.hide;

						// if ($scope.currentIndex > 0) {
						// 	var	slideHandles = $filter('filter')($ionicSlideBoxDelegate._instances, { $$delegateHandle: 'slideHandle' });
						// 	console.log(slideHandles);
						// 	if (slideHandles.length) {
						// 		var slideHandle = slideHandles[0];
						// 		slideHandle.slide(1);
						// 	}
						// };

						function onImageScroll() {
							var	scrollHandles = $filter('filter')($ionicScrollDelegate._instances, { $$delegateHandle: 'imgViewerScrollHandle'+prevIdx });
							var scrollHandle = null;
							if (scrollHandles.length) {
								scrollHandle = scrollHandles[0];
								var zoom = scrollHandle.getScrollPosition().zoom;
								var	slideHandles = $filter('filter')($ionicSlideBoxDelegate._instances, { $$delegateHandle: 'slideHandle' });
								if (slideHandles.length) {
									var slideHandle = slideHandles[0];
									if (zoom > 1) {
										slideHandle.enableSlide(false);
									} else {
										slideHandle.enableSlide(true);
									}
								}
							}
						}

						function updateView(index) {
							// console.log('viewBuffLength: '+$scope.viewBuffLength);
							// Next
							// if ($scope.currentIndex < $scope.imgList.length-1)
							// 	$scope.viewList[(index+1) % $scope.viewBuffLength] = $scope.imgList[$scope.currentIndex+1];
							// else
							// 	$scope.viewList[(index+1) % $scope.viewBuffLength] = $scope.imgList[0];
							$scope.viewList[(index+1) < $scope.viewBuffLength-1 ? index+2 : index+2-$scope.viewBuffLength] = $scope.imgList[
									($scope.currentIndex+1) < $scope.imgList.length-1 ? $scope.currentIndex+2 : $scope.currentIndex+2-$scope.imgList.length];
							// Previous
							// if ($scope.currentIndex > 0)
							// 	$scope.viewList[(index+$scope.viewBuffLength-1) % $scope.viewBuffLength] = $scope.imgList[$scope.currentIndex-1];
							// else
							// 	$scope.viewList[(index+$scope.viewBuffLength-1) % $scope.viewBuffLength] = $scope.imgList[$scope.imgList.length-1];
							$scope.viewList[(index-1) > 0 ? index-2 : $scope.viewBuffLength+index-2] = $scope.imgList[
									($scope.currentIndex-1) > 0 ? $scope.currentIndex-2 : $scope.imgList.length+$scope.currentIndex-2];
							// if ($scope.currentIndex === $scope.imgList.length-1 && index === $scope.viewBuffLength-1) {
							// 	console.log('to the end');
							// }
						}

						function slideChanged(index) {
							// console.log('index: '+index);
							// console.log('prevIdx: '+prevIdx);
							if (index === $scope.viewBuffLength-1 && prevIdx === 0) {
								$scope.currentIndex--;
							} else if (index === 0 && prevIdx === $scope.viewBuffLength-1) {
								$scope.currentIndex++;
							} else {
								if (index >= $scope.viewBuffLength) index = $scope.viewBuffLength-1;
								$scope.currentIndex += index - prevIdx;
							}
							prevIdx = index;

							// console.log($scope.currentIndex);
							if ($scope.currentIndex < 0)
								$scope.currentIndex = $scope.imgList.length-1;
							else if ($scope.currentIndex > $scope.imgList.length-1)
								$scope.currentIndex = 0;

							// console.log('currentIndex: '+$scope.currentIndex);
							// console.log('slide changed');
							updateView(index);
							// console.log('after updated: ');
							// console.log($scope.viewList);


							var	slideHandles = $filter('filter')($ionicSlideBoxDelegate._instances, { $$delegateHandle: 'slideHandle' });
							if (slideHandles.length) {
								var slideHandle = slideHandles[0];
								$timeout(function() {
									slideHandle.update();
								}, 0);
							}
						}
					}
				}
		}])
		.factory('$imageViewer', ['$ionicModal', '$rootScope', '$ionicSlideBoxDelegate',
			function($ionicModal, $rootScope, $ionicSlideBoxDelegate) {
				var _self = this;
				$scope = $rootScope.$new();

				_self.show = function(imgList, index, options) {
					$scope.imgList = imgList;
					// console.log('total: '+imgList.length);
					parseOptions(options);
					$scope.viewList = _self.setViewList($scope.imgList, index);
					$scope.currentIndex = index;
					$scope.lazyLoadFn = options.noSrcHandler || {};
					$scope.modal = $ionicModal.fromTemplate('<image-viewer lazy-load-fn="lazyLoadFn"></image-viewer>', {
						scope: $scope,
						animation: 'slide-in-up'
					});
					console.log($scope.modal);
					$scope.modal.show();
				}

				_self.hide = function() {
					$scope.modal.remove();
				}

				_self.setViewList = function(list, index) {
					if (list.length < 5) {
						$scope.initIndex = index;
						$scope.viewBuffLength = list.length;
						return list;
					}

					$scope.viewBuffLength = 5;// + list.length % 3;
					$scope.initIndex = index % $scope.viewBuffLength;
					var arr = list.slice(index-$scope.initIndex, index+$scope.viewBuffLength-$scope.initIndex);
					if (index === 0) {
						arr[$scope.viewBuffLength-1] = list[list.length-1];
						arr[$scope.viewBuffLength-2] = list[list.length-2];
					} else if (index === list.length-1) {
						arr[$scope.initIndex < $scope.viewBuffLength-1 ? $scope.initIndex+1 : 0] = list[0];
						arr[$scope.initIndex+1 < $scope.viewBuffLength-1 ? $scope.initIndex+2 : 1] = list[1];
					}
					return arr;
				}

				function parseOptions(options) {
					if (options) {
						if (options.imgSrcProp) {
							angular.forEach($scope.imgList, function(img) {
								var src = img[options.imgSrcProp] ?
									( (options.base || '')+img[options.imgSrcProp] ) : img.text;
								img.src = src;
							});
						}
					}
				}

				return _self;
			}]);

	/**
	 * @name Responsive Image
   *
   * @description Resizing the image to the specified size with retained aspect ratio.
   */
  jangularUI.directive('responsiveImg', ['$timeout', function($timeout) {
  	return {
  		restrict: 'E',
  		transclude: true,
  		replace: true,
  		template: '<div class="img-wrapper"><img><div ng-transclude></div></div>',
  		link: function(scope, elem, attrs, ctrl, transclude) {
  			var width = attrs.width;
  			var height = attrs.height;
  			if ( ( width && !angular.isNumber(parseInt(width)) && !isPercentage(width) ) || 
  					 ( height && !angular.isNumber(parseInt(height)) && !isPercentage(height) ) ) {
  				throw 'Illegal value: attribute width/height must be a number or percentage.';
  			}
  			// var wrapper = elem.find('div');
  			if (width && height) {
  				var w = isPercentage(width) ? width : width+'px';
  				var h = isPercentage(height) ? height : height+'px';
  				elem.css({width: w, height: h});
  			} else if (width) {
  				var w = isPercentage(width) ? width : width+'px';
  				elem.css({width: w, height: w});
  			} else if (height) {
  				var h = isPercentage(height) ? height : height+'px';
  				elem.css({width: h, height: h});
  			}
  			elem.find('div').replaceWith(transclude());

  			var img = elem.find('img');
  			img.on('load', function() {
  				var w = img[0].offsetWidth;
  				var h = img[0].offsetHeight;
  				var setW = w > h ? 'auto' : '100%';
  				var setH = w > h ? '100%' : 'auto';
  				$timeout(function() {
  					img.css({position: 'absolute', top: '50%', left: '50%', '-webkit-transform': 'translate3d(-50%,-50%,0)',
  								width: setW, height: setH});
  				});
  			});
  			attrs.$observe('imgSrc', function(newVal) {
  				if (!newVal) {
  					throw 'Illegal src value: attribute img-src must be specified.';
  				}
  				img.attr('src', newVal);
  			});

  			function isPercentage(value) {
  				return value.indexOf('%') !== -1;
  			}
  		}
  	};
  }]);

  /**
	 * @name Rich Article
   *
   * @description Article compound of text, image, audio, video, links, and other files.
   */
  jangularUI.directive('richArticle', ['$compile', '$timeout', '$filter', '$http', function($compile, $timeout, $filter, $http) {
  	return {
  		restrict: 'EA',
  		require: 'ngModel',
  		scope: {
  			options: '=?richOption',
  			editable: '=?',
  			article: '=ngModel',
  		},
  		link: function(scope, elem, attrs, ngModel) {
  			var $imgElem = angular.element('<responsive-img width="48%" height="150">'+(scope.editable ? '<i class="button-icon icon ion-close-circled close"></i>' : '')+'</responsive-img>');
  			var $textElem = angular.element(scope.editable ? '<textarea msd-elastic="\\n"></textarea>' : '<p class="textarea"></p>');
  			var $audioElem = angular.element('<div class="audio"><audio controls></div>');
  			var $videoElem = angular.element('<div class="video"><video'+(device.platform == 'iOS' ? ' controls' : '')+'></video>'+(device.platform == 'iOS' ? '' : '<i class="icon ion-play"></i>')+'<div>');
  			var $linkElem = angular.element('<div class="link img-left"><url-view click-handler="linkClickHandler"></url-view>'+(scope.editable ? '<i class="button-icon icon ion-close-circled close"></i>' : '')+'</div>');

  			scope.delParagraph = function(idx) {
  				// console.log('click to delete '+idx);
					scope.article.splice(idx, 1);
  			};
  			function viewImgs(imgObj) {
  				var imgList = $filter('filter')(scope.article, {type: 'img'});
					var imgIdx = imgList.indexOf(imgObj);
					// console.log(imgObj);
					// console.log(imgList);
					// console.log('selected index: '+imgIdx);
					scope.options.img.click(imgList, imgIdx);
  			};
  			function isTextParagraph(p) {
  				return p && p.type === 'text';
  			}
  			function addTextParagraph() {
  				scope.article.push({type: 'text', content: ''});
  			}
  			function playVideo($videoElem) {
  				if ($videoElem[0].paused) {
						$videoElem[0].play();
						requestFullScreen($videoElem[0]);
					}
  			}
  			function getLastChildElem() {
  				return elem.children()[elem.children().length-1];
  			}
  			function parseParagraph(p, idx) {
  				var $pElem = null;
  				switch (p.type) {
  					case 'text':
  						$pElem = $textElem.clone();
  						$pElem.attr(scope.editable ? 'ng-model' : 'ng-bind-html', 'article['+idx+'].content');
  						break;
  					case 'img':
  						$pElem = $imgElem.clone();
  						$pElem.attr('img-src', p.content);
  						scope.editable && (function() {
  							$pElem.find('i').attr('ng-click', 'delParagraph('+idx+')');
  						})();
  						break;
  					case 'audio':
  						$pElem = $audioElem.clone();
  						$pElem.find('audio').attr('src', p.content);
  						scope.editable && (function() {
  							$pElem.append('<i class="button-icon icon ion-close" ng-click="delParagraph('+idx+')"></i>');
  						})();
  						break;
  					case 'video':
  						$pElem = $videoElem.clone();
  						$pElem.find('video').attr('src', p.content);
  						scope.editable && (function() {
  							$pElem.append('<i class="button-icon icon ion-close-circled close" ng-click="delParagraph('+idx+')"></i>');
  						})();
  						break;
  					case 'link':
  						$pElem = $linkElem.clone();
  						scope.linkClickHandler = function() {
  							scope.options.link.click(p.content);
  						};
  						var promise = parseSummaryLink(p.content, {}, $http);
							if (promise) {
								promise.then(function(result) {
									scope.summaryLink = { id: new Date().getTime(), linkView: result };
									// console.log($pElem.find('url-view'));
								}, function(err) {
									console.error(err);
								});
								$pElem.find('url-view').attr('content-obj', 'summaryLink');
							}
							scope.editable && (function() {
  							$pElem.find('i').attr('ng-click', 'delParagraph('+idx+')');
  						})();
							break;
  				}
  				// newParagraph($pElem, idx);
  				elem.append( $compile($pElem)(scope) );

  				// Binding the action on Video
  				if (p.type === 'img') {
  					$pElem.on('click', function() {
							viewImgs(p);
  					});
  				} else if	(p.type === 'video') {
  					$pElem.on('click', function() {
  						playVideo($pElem.find('video'));
  					});
  					$pElem.find('video').on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {
					    var isFullscreen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
					    if (!isFullscreen) {
								this.pause();
					    }
						});
  				}
  			}
  			function setArticle() {
  				elem.html('');
  				angular.forEach(scope.article, function(paragraph, idx) {
  					console.log('parseParagraph');
	  				console.log(paragraph);
	  				parseParagraph(paragraph, idx);
	  			});
  			}

  			// console.log(scope.article);
  			if (!scope.article) scope.article = [];
  			if ( !isTextParagraph(scope.article[scope.article.length-1]) )
  				addTextParagraph();
  			// Setting the basic class
  			elem.addClass('rich-article');
				scope.editable && elem.addClass('editable');

  			scope.$watchCollection('article', function(newVal, oldVal) {
  				console.log('watch article');
  				if (!newVal) return;
  				var newComing = newVal.length - oldVal.length;
  				// console.log(newComing);
  				if (newVal.length > 1 && newComing > 0) {
  					// var newComingHeadIdx = newVal.length-newComing;
  					var checkIdx = newVal.length-newComing-1;
  					if (checkIdx > 0) {
  						if (newVal[checkIdx].type === 'text') {
	  						if (newVal[checkIdx].content === '') {
	  							newVal.splice(checkIdx, 1);
	  						}
	  						addTextParagraph();
	  					}
  					} else {
  						addTextParagraph();
  					}
  				} else if (newComing < 0
  						&& isTextParagraph(newVal[newVal.length-1]) && isTextParagraph(newVal[newVal.length-2]) ) {
  					newVal.splice(newVal.length-1, 1);
  				} else if (newVal.length == 0) {
  					addTextParagraph();
  				}
  				setArticle();
  			});
  		}
  	};
  }]);

	/**
	 * Url View
   *
   */
  jangularUI.directive('urlView', ['$urlView', '$timeout', '$rootScope', function($urlView, $timeout, $rootScope) {
  	return {
  		restrict: 'EA',
  		scope: {
  			contentObj: '=',
  			maxLength: '=',
  			clickHandler: '=',
  		},
  		template: '<a class="url-view" ng-click="clickHandler()">'+
  								'<div class="content">'+
	  								'<div class="graph"><img ng-src="{{ ::view.image }}" ng-if="::view.image"></div>'+
	  								'<div class="info">'+
		  								'<h5 class="title" ng-bind-html="::view.title"></h5>'+
		  								'<p class="descript" ng-bind-html="::view.description"></p>'+
		  								'<div class="comment">{{ ::view.comment }}</div>'+
		  								'<div class="tags"><span class="badge" ng-repeat="tag in content.tags | limitTo:5">{{ tag }}</span><span ng-if="content.tags.length > 5">...</span></div>'+
		  							'</div>'+
  								'</div>'+
	  						'</a>',
  		link: function(scope, elem, attrs) {
  			function applyView() {
  				$timeout(function() {
	  				scope.content = scope.contentObj || $urlView.getContentObj();
	  				// console.log(scope.content);
	  				if (scope.content) {
	  					scope.view = scope.content.linkView;
		  				// console.log(scope.view);
		  				if (scope.maxLength && scope.view.description && scope.view.description.length > scope.maxLength) {
		  					scope.view.description = scope.view.description.substr(0, scope.maxLength)+'...';
		  				}
			  			var noScheme = scope.view.url.replace(/(http|ftp|https):\/\//gi, '');
			  			if (noScheme.lastIndexOf('/') >= 0) {
			  				scope.view.comment = noScheme.substring(0, noScheme.lastIndexOf('/'));
			  			} else {
			  				scope.view.comment = noScheme;
			  			}
			  			var params = {};
			  			params[scope.content.id] = true;
			  			$rootScope.$broadcast('urlViewLoaded', params);
	  				} else {
	  					var watcher = scope.$watch('contentObj', function(newVal) {
	  						newVal && applyView() && watcher();
	  					});
	  				}
	  			});
  			}
  			
				applyView();

  			// scope.$watch('contentObj', function(newVal, oldVal) {
  			// 	if (newVal && newVal !== oldVal) {
  			// 		console.log('urlView: ');
  			// 		console.log(scope.contentObj);
  			// 		applyView();
  			// 	}
  			// });
  		}
  	};
  }]);
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

  jangularUI.directive('sidePanel', [function() {
  	return {
  		restrict: 'E',
  		transclude: 'true',
  		replace: true,
  		template: '<div class="panel-backdrop"><div class="side-panel" ng-transclude></div></div>',
  		link: function(scope, elem, attrs) {
  			var panel = elem.find('div').eq(0);
  			console.log('sidePanel');
  			console.log(panel);
  			panel.addClass( 'side-panel-'+(attrs.side || 'right') );
  		}
  	};
  }]).service('$sidePanel', ['$jgTemplate', '$compile', '$timeout', '$ionicGesture', function($jgTemplate, $compile, $timeout, $ionicGesture) {
	  var _$container = null;
	  var _showListener = {};
	  var _hideListener = {};

  	function createSidePanel(templateString, options) {
  		var scope = options.scope && options.scope.$new() || $rootScope.$new(true);
	  	var element = $compile(templateString)(scope);
	  	if (!options.container) {
	  		throw 'The container of the side-panel must be specified.';
	  	}
	  	_$container = angular.element(options.container);
	  	// var menu = angular.element(wrapper.querySelector('.grid-menu'));

	  	var sidePanel = {
	  		$el: element.children().eq(0),
	  		el: element.children()[0],
	  		$backdrop: element,
	  		backdrop: element[0],
	  		// $panel: panel,
	  		scope: scope,
	  		show: show,
	  		hide: hide,
	  		isShown: isShown,
	  		remove: remove,
	  		// hasHeader: options.hasHeader || false
	  	};

	  	// Binding the Events
	  	_showListener = function() {
  			show(sidePanel);
	  	};
	  	_hideListener = function() {
  			hide(sidePanel);	  		
	  	};
	  	$ionicGesture.on('swipeleft', sidePanel.$el.hasClass('side-panel-right') ? _showListener : _hideListener, _$container);
	  	$ionicGesture.on('swiperight', sidePanel.$el.hasClass('side-panel-right') ? _hideListener : _showListener, _$container);
	  	// _$container.on('click', _hideListener);

	  	return sidePanel;
  	}

  	function show(panelInstance) {
			var self = panelInstance || this;
			// if (self.hasHeader) {
			// 	angular.element(self.el.querySelector('.panel-wrapper')).addClass('has-header');
			// }

			// Append to body if not present.
			if (!self.backdrop.parentElement) {
				_$container.append(self.backdrop);
			}

			self.$backdrop.addClass('active');
			self.$el.css('display', 'block');
			// To ensure the content would fit the panel
  		self.$el.children().eq(0).removeClass('has-header has-footer has-tabs-top');
			self._isShown = true;

			self.$el.addClass('ng-enter')
             		.removeClass('ng-leave ng-leave-active');

      $timeout(function() {
      	self.$el.addClass('ng-enter-active');
      });

			return $timeout(function() {
        //After animating in, allow hide on backdrop click
        self.$backdrop.on('click', function(e) {
        	// console.log(e.target);
        	// console.log(self.backdrop);
        	// console.log(e.target === self.backdrop);
          if (e.target === self.backdrop) {
            self.hide();
          }
        });
      }, 400);
		};
		function hide(panelInstance) {
			var self = panelInstance || this;

			self.$el.addClass('ng-leave');

      $timeout(function() {
      	self.$el.addClass('ng-leave-active')
      						.removeClass('ng-enter ng-enter-active');
      }, 20);

			self._isShown = false;

			return $timeout(function() {
        // self.$el.removeClass('has-header');
				self.$el.css('display', 'none');
				self.$backdrop.removeClass('active');
      }, self.hideDelay || 120);
		};
		function isShown() {
			return this._isShown;
		};

  	/**
     * @ngdoc method
     * @name sidePanel#remove
     * @description Remove this sidePanel instance from the DOM and clean up.
     * @returns {promise} A promise which is resolved when the sidePanel is finished animating out.
     */
    function remove() {
      var self = this;
      self.scope.$parent && self.scope.$parent.$broadcast(self.viewType + '.removed', self);

      return self.hide().then(function() {
        self.scope.$destroy();
        self.$el.remove();
     //    $ionicGesture.off('swipeleft', _showListener, _$container);
	  		// $ionicGesture.off('swiperight', _hideListener, _$container);
      });
    }

  	this.fromTemplateUrl = function(url, options) {
			return $jgTemplate.fetchTemplate(url).then(function(templateString) {
				return createSidePanel(templateString, options);
			});
		};
  }]);

	// Services
  // Service of type
  jangularUI.factory('$checkFormat', function() {
  	var _self = this;

  	_self.isImg = isImg;
  	_self.isAudio = isAudio;
  	_self.isVideo = isVideo;
  	
  	return _self;
  });
  jangularUI.factory('$juiUtility', ['$http', function($http) {
  	function getSummaryLink(link, obj) {
  		return parseSummaryLink(link, obj, $http);
  	}
  	return {
  		getSummaryLink: getSummaryLink,
  	};
  }]);

  // Filters
  // Grouping by the property.
  jangularUI.filter('groupBy', function ($filter) {
		return function(collection, prop, ref) {
			var groupList = [];
			var sortedArr = collection;
			if (!angular.isNumber(prop)) sortedArr = $filter('orderBy')(collection, prop);
			var groupName = '_INVALID_GROUP_';
			var rowNum = 0;
			angular.forEach(sortedArr, function(item, index) {
				var gName = '';
				if (ref && !angular.isFunction(ref)) {
					var pathNameArr = item[ref].split('/');
					gName = pathNameArr[0];
					if (pathNameArr.length > 2) {
						gName = pathNameArr[pathNameArr.length-2];
					}
				} else if (ref) {	// If function
					gName = ref(item);
				} else {
					if (angular.isNumber(prop)) {
						if (index > 0 && (index % prop == 0) ) rowNum++;
						gName = 'row'+rowNum;
					} else {
						gName = item[prop];
					}
				}
				if (gName != groupName) {
					var group = { name: gName, filename: gName, time: -1, size: -1, items: [] };
					groupName = group.name;
					groupList.push(group);
				}
				groupList[groupList.length-1].items.push(item);
				// console.log(groupList[groupList.length-1]);
			});
			return groupList;
		}
	});

  // Constants
  jangularUI.constant('METATYPE', METATYPE);

	return jangularUI;
})();