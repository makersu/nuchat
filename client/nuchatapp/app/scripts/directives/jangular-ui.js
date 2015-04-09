/**
 *  (Partial) Jangular UI directives
 *  @author   James Hsiao
 *  @lib      Ionic App Labs
 *
 *  Include:
 *  1) Meta-Message
 *  2) WWW Trigger
 *  3) Grid Menu
 *  4) In View Window
 *  5) Url(link) View
 *  6) Collapse Buttons
 *  7) Flip Item
 *  8) Image Viewer
 *  9) Center Image
 */
(function() {
	var jangularUI = angular.module('jangular.ui', ['Nuchatapp.configs']);

	var METATYPE = {
		LINK:  	  'link',
		IMG: 			'image',
		AUDIO:    'audio',
		VIDEO:    'video',
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

	/**
	 * Meta Message
	 * 
	 * @support
	 * 1) Hyper-link
	 * 2) Image: jpg|jpeg|png|bmp|gif|tiff|tif|svg
	 * 3) Audio: 3gp|3gpp|mp3|ogg|wav|m4a|m4b|m4p|m4v|m4r|aac|mp4
	 * 4) Video: ogg|mp4|webm (HTML 5 Video supports)
	 */
	jangularUI.directive('metaMsg', function($http, $q, $compile, $urlView, $filter, $location, $ionicScrollDelegate, $sce, $timeout) {
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
								 <a class="extend" ng-if="extended" ng-click="hide()">...{{ ::\'LESS\' | translate }}</a>',
			link: function(scope, elem, attrs) {
				var _audioSetting = scope.metaOption.audioSetting || {};
				var _foldingThres = scope.metaOption.foldingThres || FOLDING_LINE_THRES;
				var _remoteSrv = scope.metaOption.remote || ''; // Empty if use the local file for development...
				var _originMsg = scope.message = scope.msg.text;
				var _msgContent = elem.find('div');
				var _scrollHandle = $ionicScrollDelegate.$getByHandle(scope.scrollHandle);

				parse(scope.type)
					.then(function(view) {
						elem.append(view);
					}, errorHandler);

				// Registering events.
				scope.$on('uploaded', function() {
					scope.uploading = false;
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
		      _scrollHandle.$anchorScroll();
				};

				// Metatype parsing
				function parse(type) {
					var q = $q.defer();
					switch (type) {
						case METATYPE.LINK:
							parseLink()
								.then(function(linkView) {
									scope.msg.linkView = linkView;
									// $urlView.setContentObj(scope.msg);
									q.resolve($compile('<url-view content-obj="msg"></url-view>')(scope));
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
								scope.msg.linkView = linkView;
								// $urlView.setContentObj(scope.msg);
								// console.log('set Link view back');
								q.resolve($compile('<url-view content-obj="msg"></url-view>')(scope));
							}, function(err) {
								q.reject(err);
							});
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
					var q = $q.defer();
					var cacheView = { id: scope.msg.id };
					scope.msg.type = METATYPE.LINK;
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
									if (!cacheView.url) {
										cacheView.url = link;
									}
									if (!cacheView.image) {
										cacheView.image = cacheView.url+'/favicon.ico';
									} else if (cacheView.image.indexOf('/') == 0) {
										cacheView.image = cacheView.url+cacheView.image;
									}
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
					// scope.msg.type = METATYPE.IMG;
					scope.msg.isImg = true;
					var imgSrc = scope.msg.thumbnailFileId ? _remoteSrv+scope.msg.thumbnailFileId : scope.message;
					scope.uploading = !scope.msg.thumbnailFileId;
					var $imgElem = angular.element('<img id="img'+scope.msg.id+'" src="'+imgSrc+'">');
					_msgContent.append($imgElem).append( $compile('<ion-spinner ng-if="uploading"></ion-spinner>' )(scope) );
					$imgElem.on('click', scope.metaOption.imgSetting.clickHandler ? function() {
						scope.metaOption.imgSetting.clickHandler(scope.msg.id);
					} : {});
				}

				// Assuming the audio uri provided.
				function parseAudio() {
					// TODO: if audioSetting is not set, throw the error message.
					// scope.msg.type = METATYPE.AUDIO;
					var audioUrl = scope.msg.originalFileId ? _remoteSrv+scope.msg.originalFileId : scope.message;//
					scope.uploading = !scope.msg.originalFileId;

					// scope.message = '<img class="audio" src="'+_audioSetting.stop.img+'"><i class="icon ion-play"></i>';
					_msgContent.append( $compile('<img class="audio" src="'+_audioSetting.stop.img+'"><i class="icon ion-play"></i><ion-spinner icon="lines" ng-if="uploading"></ion-spinner>' )(scope) );
					elem.bind('click', function() {
						scope.msg.isPlaying = !scope.msg.isPlaying;
						setView();
						
						if (scope.msg.isPlaying) {
							_audioSetting.play.fn(audioUrl)
								.then(function() {
									console.log('played');
									scope.msg.isPlaying = false;
									setView();
								});
						} else {
							_audioSetting.stop.fn();
						}

						function setView() {
							var img = elem.find('img');
							img[0].src = scope.msg.isPlaying ? _audioSetting.play.img : _audioSetting.stop.img;
							var icon = elem.find('i');
							icon[0].className = scope.msg.isPlaying ? _audioSetting.play.icon : _audioSetting.stop.icon;
						}
					});
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
					  elem.exitFullscreen();
					} else if (elem.msExitFullscreen) {
					  elem.msExitFullscreen();
					} else if (elem.mozCancelFullScreen) {
					  elem.mozCancelFullScreen();
					} else if (elem.webkitExitFullscreen) {
					  elem.webkitExitFullscreen();
					}
				}

				function parseVideo() {
					// scope.msg.type = METATYPE.VIDEO;
					var videoUrl = scope.msg.originalFileId ? _remoteSrv+scope.msg.originalFileId : scope.message;//
					var thumbnailUrl = scope.msg.thumbnailFileId ? _remoteSrv+scope.msg.thumbnailFileId : scope.message;
					scope.uploading = !scope.msg.originalFileId;
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
					_msgContent.append($compile('<ion-spinner icon="crescent" ng-if="uploading"></ion-spinner>')(scope));
					// scope.message = $sce.trustAsHtml('<video width="200" height="120" controls><source src="'+videoUrl+'"></video>');
					// _msgContent.append( $compile('<video width="200" height="120" controls><source src="'+videoUrl+'"></video><ion-spinner ng-if="uploading"></ion-spinner>' )(scope) );
					// _msgContent.append( $compile('<i class="icon ion-play"></i>' )(scope) );
					// _msgContent.append( $compile('<video width="200" height="120" controls><source src="'+videoUrl+'"></video><ion-spinner ng-if="uploading"></ion-spinner>' )(scope) );
					// console.log('parsing video');
					// console.log(scope.message);
				}

				function parseText() {
					var text = scope.message;
					var lines = scope.message.split('\n');
					if (lines.length > _foldingThres || scope.message.length > FOLDING_CHAR_THRES) {
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
	 *  In View Window
	 *
	 *  @description  Auto hide/show when element outside/inside the view window.
	 *
	 */
	jangularUI.directive('inViewWindow', function() {
		return {
			restrict: 'A',
			link: function(scope, elem, attrs) {
				var winEl = angular.element(document.querySelector(attrs.inViewWindow));
				var viewWin = verge.rectangle(winEl[0], 10);

				function isInViewWindow() {
					var elRect = verge.rectangle(elem[0]);
					return (elRect.top > viewWin.top && elRect.top < viewWin.bottom || elRect.bottom > viewWin.top && elRect.bottom < viewWin.bottom)
						&& (elRect.left > viewWin.left && elRect.left < viewWin.right || elRect.right > viewWin.left && elRect.right < viewWin.right);
				}

				winEl.on('scroll', _.debounce(function() {
						if (isInViewWindow()) {
							elem.css('visibility', 'visible');
						} else {
							elem.css('visibility', 'hidden');
						}
					}, 100)
				);
			}
		};
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
					btnElm.attr('ng-if', 'isExpanded');
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
							// console.log('prevIdx: '+prevIdx);
							if (index === $scope.viewBuffLength-1 && prevIdx === 0) {
								$scope.currentIndex--;
							} else if (index === 0 && prevIdx === $scope.viewBuffLength-1) {
								$scope.currentIndex++;
							} else {
								$scope.currentIndex += index - prevIdx;
							}
							prevIdx = index;

							if ($scope.currentIndex < 0)
								$scope.currentIndex = $scope.imgList.length-1;
							else if ($scope.currentIndex > $scope.imgList.length-1)
								$scope.currentIndex = 0;

							// console.log(index);
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
					parseOptions(options);
					$scope.viewList = _self.setViewList($scope.imgList, index);
					$scope.currentIndex = index;
					$scope.lazyLoadFn = options.noSrcHandler || {};
					$scope.modal = $ionicModal.fromTemplate('<image-viewer lazy-load-fn="lazyLoadFn"></image-viewer>', {
						scope: $scope,
						animation: 'slide-in-up'
					});
					// console.log($scope.modal);
					$scope.modal.show();
				}

				_self.hide = function() {
					$scope.modal.remove();
				}

				_self.setViewList = function(list, index) {
					if (list.length < 5) {
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
								img.src = (options.base || '')+img[options.imgSrcProp];
							});
						}
					}
				}

				return _self;
			}]);

	/**
	 * Center Image
   *
   */
  jangularUI.directive('centerImg', function() {
  	return {
  		restrict: 'A',
  		link: function(scope, elem, attrs) {
  			var img = elem;
  			if (img[0].tagName !== 'IMG') {
  				img = elem.find('img');
  			}
  			if (!img) {
  				throw 'Can\'t find img element.';
  			}
  			img.on('load', function() {
  				var w = img[0].offsetWidth;
  				var h = img[0].offsetHeight;
  				img.css({position: 'absolute', top: '50%', left: '50%', '-webkit-transform': 'translate3d(-50%,-50%,0)',
  								width: w > h ? 'auto' : '100%', height: w > h ? '100%' : 'auto'});
  			});
  		}
  	};
  });

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
  		},
  		template: '<a class="url-view" href="{{ ::view.url }}">'+
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

  // Service of type
  jangularUI.factory('$checkFormat', function() {
  	var _self = this;

  	_self.isImg = isImg;
  	_self.isAudio = isAudio;
  	_self.isVideo = isVideo;
  	
  	return _self;
  });

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