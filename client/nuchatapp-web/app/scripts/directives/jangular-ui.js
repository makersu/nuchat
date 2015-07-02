(function() {
	var jangularUI = angular.module('jangular.ui', ['ui.scroll', 'ui.scroll.jqlite', 'pascalprecht.translate', 'angularMoment', 'ngFileUpload']);
	var DEBUG = false;

	var METATYPE = {
		LINK:  	  'link',
		IMG: 			'image',
		AUDIO:    'audio',
		VIDEO:    'video',
		ARTICLE:  'article',
		GROUP: 		'group',
		CALENDAR: 'calendar',
		MAP:      'map',
		FILE:     'file', // Including documents?
		UNKNOWN:  'unknown',
	};

	var FOLDING_LINE_THRES = 5;
	var FOLDING_CHAR_THRES = 256;

	/* Global Functions */

	function hashCode(str) {
	  var hash = 0, i, chr, len;
	  if (str.length == 0) return hash;
	  for (i = 0, len = str.length; i < len; i++) {
	    chr   = str.charCodeAt(i);
	    hash  = ((hash << 5) - hash) + chr;
	    hash |= 0; // Convert to 32bit integer
	  }
	  return hash;
	}

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
						obj.image = (obj.image.indexOf('//') === 0 ? 'http:' : obj.url)+(obj.image.indexOf('/') === 0 ? '' : '/')+obj.image;
					}
					return obj;
				}, function(err) {
					return err;
				});
		}
		return promise;
	}

	function isIOS() {
		console.log(device);
		return device.platform == 'iOS';
	}

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

	function isFile(contentType) {
		return checkType(contentType, 'application/');
	}

	function isLink(content) {
		return ( content.type && checkType(content.type, METATYPE.LINK) ) || getLinks(content.text);
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

	/* Constants */
  jangularUI.constant('METATYPE', METATYPE);

	/* Services */

	// Service of type
  jangularUI.factory('$checkFormat', function() {
  	var _self = this;

  	_self.isImg = isImg;
  	_self.isAudio = isAudio;
  	_self.isVideo = isVideo;
  	_self.isFile = isFile;
  	_self.isLink = isLink;
  	
  	return _self;
  });
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

	/* Filters */
	jangularUI.filter('groupDiv', ['$filter', function($filter) {
		return function(collection, prop) {
			if ( angular.isUndefined(prop) || angular.isNumber(prop) ) {
				throw 'parameter groupBy should be a string or a function.';
			}
			var sortedArr = $filter('orderBy')(collection, prop);
			var groupName = '_UNDEFINED_';
			var groupList = [];
			// console.log(prop);
			angular.forEach(sortedArr, function(item) {
				var gName = '';
				if ( angular.isFunction(prop) ) {
					gName = prop(item);
				} else {
					gName = item[prop];
				}
				if (gName !== groupName) {
					groupList.push({ type: METATYPE.GROUP, text: gName });
					groupName = gName;
				}
				item.group = gName;
				groupList.push(item);
			});
			// console.log(groupList);
			return groupList;
		}
	}]);
	jangularUI.filter('amChatGrouping', ['moment', '$filter', function(moment, $filter) {
		function amFilter(value, preprocess) {
			moment.locale(moment.locale(), {
				calendar: {
					lastDay: '['+$filter('translate')('YESTERDAY')+']',
					lastWeek: 'MM-DD ddd',
					sameDay: '['+$filter('translate')('TODAY')+']',
					sameElse: 'MM-DD ddd'
				}
			});

			// console.log(moment($filter('amCalendar')(value)).format('MM-DD'));
			return $filter('amCalendar')(value);
		}
		return amFilter;
	}]);
	jangularUI.filter('byteFormat', function() {
		return function(bytes, precision) {
			if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
			if (typeof precision === 'undefined') precision = 1;
			var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
				number = Math.floor(Math.log(bytes) / Math.log(1024));
			return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
		}
	});

	/* Directives */

	/**
	 * Group Tag
	 */
	jangularUI.directive('groupTag', function() {
		return {
			restrict: 'EA',
			replace: true,
			template: '<div class="group-tag"><hr><div class="group-name">{{ name }}</div><hr></div>',
			link: function(scope, elem, attrs) {
				scope.name = attrs.name || 'Undefined';
			}
		};
	});

	/**
	 * Url View
   *
   */
  jangularUI.directive('urlView', ['$timeout', '$rootScope', function($timeout, $rootScope) {
  	return {
  		restrict: 'EA',
  		scope: {
  			content: '=contentObj',
  			clickHandler: '=',
  			maxLength: '=',
  		},
  		template: '<a class="url-view" ng-click="clickHandler(view.url)">'+
  								'<div class="content">'+
	  								'<div class="graph"><img img-cache ng-src="{{ view.image }}" ng-if="view.image"></div>'+
	  								'<div class="info">'+
		  								'<h5 class="title" ng-bind-html="view.title | limitTo:64"></h5>'+
		  								'<p class="descript" ng-bind-html="view.description | limitTo:36"></p>'+
		  								'<div class="comment">{{ view.comment }}</div>'+
		  								'<div class="tags"><span class="badge" ng-repeat="tag in content.tags | limitTo:5">{{ tag }}</span><span ng-if="content.tags.length > 5">...</span></div>'+
		  							'</div>'+
  								'</div>'+
	  						'</a>',
  		link: function(scope, elem, attrs) {
  			function applyView() {
					scope.view = scope.content.linkView;
					!scope.clickHandler && elem.find('a').removeAttr('ng-click').attr({'href': scope.view.url, 'target': '_blank'});

  				if (scope.view) {
  					parseView();
  				} else {
  					var watcher = scope.$watch('content.linkView', function(newVal) {
  						scope.view = newVal;
  						newVal && parseView() && watcher();
  					});
  				}
  			}

  			function parseView() {
  				if (scope.maxLength && scope.view.description && scope.view.description.length > scope.maxLength) {
  					scope.view.description = scope.view.description.substr(0, scope.maxLength)+'...';
  				}
  				if (scope.view.url) {
  					var noScheme = scope.view.url.replace(/(http|ftp|https):\/\//gi, '');
		  			if (noScheme.lastIndexOf('/') >= 0) {
		  				scope.view.comment = noScheme.substring(0, noScheme.lastIndexOf('/'));
		  			} else {
		  				scope.view.comment = noScheme;
		  			}
  				}
	  			var params = {};
	  			params[scope.content.id] = true;
	  			$rootScope.$broadcast('urlViewLoaded', params);
  			}
  			
  			var watcher = scope.$watch('content', function(newVal) {
					// console.log(newVal);
					newVal && applyView();
				});
  		}
  	};
  }]);

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
												      '<img img-cache ng-src="{{ img.src }}">'+
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
	 * Meta Message
	 * 
	 * @support
	 * 1) Hyper-link
	 * 2) Image: jpg|jpeg|png|bmp|gif|tiff|tif|svg
	 * 3) Audio: 3gp|3gpp|mp3|ogg|wav|m4a|m4b|m4p|m4v|m4r|aac|mp4
	 * 4) Video: ogg|mp4|webm (HTML 5 Video supports)
	 */
	jangularUI.directive('metaMsg', function($http, $rootScope, $q, $compile, $filter, $location, $ionicScrollDelegate, $sce, $timeout) {
		return {
			restrict: 'EA',
			template: '<div class="content" id="{{ msgId }}"></div>\
								 <a class="extend" ng-if="hasMore && !extended" ng-click="extend()">...{{ ::\'MORE\' | translate }}</a>\
								 <a class="extend" ng-if="extended" ng-click="hide()">...{{ ::\'LESS\' | translate }}</a>\
								 <div class="tags" ng-if="notLink()"><span class="badge" ng-repeat="tag in message.tags | limitTo:5">{{ tag }}</span><span ng-if="message.tags.length > 5">...</span></div>',
			link: function(scope, elem, attrs) {
				var msg = attrs.msg;
				var metaOption = attrs.metaOption;
				var type = attrs.type;
				var scrollHandle = attrs.scrollHandle;

				// var _audioSetting = scope[metaOption].audioSetting || {};
				var _foldingThres = scope[metaOption].foldingThres || FOLDING_LINE_THRES;
				var _linkSetting = scope[metaOption].linkSetting || {};
				var _remoteSrv = scope[metaOption].remote || ''; // Empty if use the local file for development...
				var _message, _originMsg;
				var _msgContent = elem.find('div');
				var _scrollHandle = $ionicScrollDelegate.$getByHandle(scope[scrollHandle]);

				// console.log('metaMsg');
				var msgWatcher = scope.$watch(msg, function(newVal, oldVal) {
					if (newVal) {
						// console.log(newVal);
						_originMsg = _message = newVal.text;
						scope.msgId = newVal.id;
						scope.hasMore = false;
						scope.extended = false;
						_msgContent.empty();
						parse(scope[type]);
						msgWatcher();
					}
				});

				// Registering events.
				scope.$on('uploaded', function(event, args) {
					if (scope[msg].roomId === args.msg.roomId && scope[msg].ownerId === args.msg.ownerId) {
						if (args.msg.timestamp === scope[msg].timestamp) {
							// console.log(args.msg);
							// console.log(scope[msg]);
							scope[msg].uploading = false;
							$rootScope.$broadcast('updateObjMsg', { msg: args.msg });
						}
					}
				});

				scope.extend = function() {
					scope.extended = true;
					_message = $filter('nl2br')(_originMsg);
					_msgContent.html('').append(_message);
				};
				scope.hide = function() {
					scope.extended = false;
					_message = _originMsg;
					parseText();
		      $location.hash(scope[msg].id);
		      _scrollHandle.anchorScroll();
				};
				scope.linkClickHandler = function(link) {
					// console.log(scope[msg].text);
					_linkSetting.clickHandler && _linkSetting.clickHandler(link || scope[msg].text);
				};
				scope.notLink = function() {
					return scope[msg] ? scope[msg].type && scope[msg].type !== METATYPE.LINK || !scope[msg].type : true;
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
							parseFile();
							break;
						default:
							parseUnknown();
							break;
					}
				}

				function parseUnknown() {
					var q = $q.defer();
					var links = getLinks(_message);
					if (links) {
						parseLink(links);
					} else if ( isImg(scope[msg].type) ) { //
						parseImg();
					} else if ( isAudio(scope[msg].type) ) {
						parseAudio();
					} else if ( isVideo(scope[msg].type) ) {
						parseVideo();
					} else if ( isFile(scope[msg].type) ) {
						parseFile();
					} else {
						parseText();
					}
					return q.promise;
				}

				// Appending the summary block after the links.
				function parseLink(links) {
					// console.log(links);
					// var q = $q.defer();
					var cacheView = { id: scope[msg].id };
					scope[msg].type = METATYPE.LINK;
					if (scope[msg].linkView) {
						var link = links[0];
						_message = _message.toLowerCase().replace(link, '<a '+(_linkSetting.clickHandler ? 'ng-click="linkClickHandler(\''+link+'\')"' : 'href="'+link+'" target="_blank"')+'>'+link+'</a>');
						$compile(_msgContent.html('').append(_message))(scope);
						_msgContent.append( $compile('<url-view class="img-left brief" content-obj="'+msg+'"'+(_linkSetting.clickHandler ? ' click-handler="linkClickHandler"' : '')+'></url-view>')(scope) );
					} else {
						angular.forEach(links, function(link) {
							var promise = parseSummaryLink(link, cacheView, $http);
							if (promise) {
								promise.then(function(result) {
									_message = _message.toLowerCase().replace(link, '<a '+(_linkSetting.clickHandler ? 'ng-click="linkClickHandler(\''+link+'\')"' : 'href="'+link+'" target="_blank"')+'>'+link+'</a>');
									$compile(_msgContent.html('').append(_message))(scope);
									scope[msg].linkView = result;
									_msgContent.append( $compile('<url-view class="img-left brief" content-obj="'+msg+'"'+(_linkSetting.clickHandler ? ' click-handler="linkClickHandler"' : '')+'></url-view>')(scope) );
								}, errorHandler);
							}
						});
					}
					// return q.promise;
				}

				// Assuming the img uri provided.
				function parseImg() {
					console.log('parseImg');
					// scope[msg].type = METATYPE.IMG;
					scope[msg].isImg = true;
					var imgSrc = $sce.trustAsResourceUrl(scope[msg].thumbnailFileId ? _remoteSrv+scope[msg].thumbnailFileId : _message);
					scope[msg].uploading = !scope[msg].thumbnailFileId;
					// console.log('parseImg uploading? '+scope[msg].uploading);
					// console.log(scope[msg]);
					// var $imgElem = angular.element('<img id="img'+scope[msg].id+'" src="'+imgSrc+'">');
					var $imgElem = angular.element('<img id="img'+scope[msg].id+'" img-cache ng-src="'+imgSrc+'">');
					_msgContent.append( $compile($imgElem)(scope) ).append( $compile('<ion-spinner ng-if="msg.uploading"></ion-spinner>')(scope) );
					$imgElem.on('click', scope[metaOption].imgSetting.clickHandler ? function() {
						scope[metaOption].imgSetting.clickHandler(scope[msg].id || scope[msg].timestamp);
					} : {});
				}

				// Assuming the audio uri provided.
				function parseAudio() {
					// TODO: if audioSetting is not set, throw the error message.
					var audioUrl = scope[msg].originalFileId ? _remoteSrv+scope[msg].originalFileId : _message;//
					scope[msg].uploading = !scope[msg].originalFileId;

					_msgContent.append( $compile('<audio src="'+audioUrl+'" controls></audio><ion-spinner icon="lines" ng-if="msg.uploading"></ion-spinner>' )(scope) );
				}

				function parseVideo() {
					// scope[msg].type = METATYPE.VIDEO;
					var videoUrl = scope[msg].originalFileId ? _remoteSrv+scope[msg].originalFileId : _message;//
					var thumbnailUrl = scope[msg].thumbnailFileId ? _remoteSrv+scope[msg].thumbnailFileId : _message;
					scope[msg].uploading = !scope[msg].originalFileId;
					var $videoElem = angular.element('<video class="video-thumb" poster="'+thumbnailUrl+'"><source src="'+videoUrl+'"></video>');

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
					// if (!isIOS()) {
						_msgContent.append($playBtn);
					// }
					_msgContent.append($compile('<ion-spinner icon="crescent" ng-if="msg.uploading"></ion-spinner>')(scope));
				}

				function parseFile() {
					var fileTpl = '<div class="message-file"><img ng-src="'+scope[msg].typeIcon+'"><div class="message-file-info">'+scope[msg].text+'<div class="message-file-detail">'+$filter('translate')('SIZE')+': '+$filter('byteFormat')(scope[msg].size)+'</div></div></div>';
					_msgContent.append($compile(fileTpl)(scope));
				}

				function parseText() {
					var text = _message;
					var lines = _message.split('\n');
					if (lines.length > _foldingThres || _message.length > FOLDING_CHAR_THRES) {
						text = '';
						for (var i = 0; i < lines.length && i < _foldingThres && text.length < FOLDING_CHAR_THRES; i++) {
							text += lines[i]+'<br>';
						}
						text = text.substring(0, text.length-4);
						if (text.length > FOLDING_CHAR_THRES) text = text.substr(0, FOLDING_CHAR_THRES);
						scope.hasMore = true;
						// _message = text;
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
	 * Resize Edge
	 *
	 * @description  directive makes the target/parent element resizable on the edge/corner.
	 *
	 */
	jangularUI.directive('resizeEdge', ['$document', function($document) {
		return {
			restrict: 'E',
			template: '<div class="resize-edge"></div>',
			replace: true,
			link: function(scope, elem, attrs) {
				var isCorner = eval(attrs.corner) || false;
				var $targetEl = angular.element(document.getElementById(attrs.targetId) || elem.parent()[0]);
				var isResizing = false;
				var direction = 'top';
				var prevX, prevY;

				// Determine the resizable direction
				isCorner ? (
						attrs.direction ? ( (function() {
							var dirs = attrs.direction.split(' ');
							elem.addClass('resize-'+dirs[0]);
							switch (dirs[0]) {
								case 'top':
								case 'bottom':
									elem.addClass('resize-'+dirs[1] || 'left');
									direction = dirs[0] + (dirs[1] || 'left');
									break;
								case 'left':
								case 'right':
									elem.addClass('resize-'+dirs[1] || 'top');
									direction = dirs[0] + (dirs[1] || 'top');
									break;
							}
						})() ) : ( (function() {
							elem.addClass('resize-corner resize-top resize-left');
							direction = 'topleft';
						})() )
					) : ( (function() {
							direction = attrs.direction || 'top';
							elem.addClass('resize-'+direction);
						})()
					);

				elem.on('mousedown', function(e) {
					isResizing = true;
					// console.log(e);
					prevX = e.x;
					prevY = e.y;
				});
				$document.on('mousemove', function(e) {
					if (isResizing) {
						var movY = e.movementY || e.y - prevY;
						var movX = e.movementX || e.x - prevX;
						switch (direction) {
							case 'top':
								$targetEl.css('height', $targetEl[0].offsetHeight-movY+'px');
								break;
							case 'bottom':
								$targetEl.css('height', $targetEl[0].offsetHeight+movY+'px');
								break;
							case 'left':
								$targetEl.css('width', $targetEl[0].offsetWidth-movX+'px');
								break;
							case 'right':
								$targetEl.css('width', $targetEl[0].offsetWidth+movX+'px');
								break;
							case 'topleft':
							case 'lefttop':
								$targetEl.css('height', $targetEl[0].offsetHeight-movY+'px');
								$targetEl.css('width', $targetEl[0].offsetWidth-movX+'px');
								break;
							case 'topright':
							case 'righttop':
								$targetEl.css('height', $targetEl[0].offsetHeight-movY+'px');
								$targetEl.css('width', $targetEl[0].offsetWidth+movX+'px');
								break;
							case 'bottomleft':
							case 'leftbottom':
								$targetEl.css('height', $targetEl[0].offsetHeight+movY+'px');
								$targetEl.css('width', $targetEl[0].offsetWidth-movX+'px');
								break;
							case 'bottomright':
							case 'rightbottom':
								$targetEl.css('height', $targetEl[0].offsetHeight+movY+'px');
								$targetEl.css('width', $targetEl[0].offsetWidth+movX+'px');
								break;
						}
						prevX = e.x;
						prevY = e.y;
					}
				});
				$document.on('mouseup', function(e) {
					// console.log('mouseup');
					isResizing = false;
				});
			}
		};
	}]);

	/**
	 * Chatbox
	 *
	 * @description  chatbox for web.
	 *
	 */
	jangularUI.directive('chatbox', ['$filter', '$chatbox', '$timeout', '$location', '$anchorScroll', '$checkFormat', 'RoomService', function($filter, $chatbox, $timeout, $location, $anchorScroll, $checkFormat, RoomService) {
		return {
			restrict: 'EA',
			transclude: true,
			scope: {
				currentUser: '=',
				roomName: '@title',
				id: '@',
				roomObj: '=',
				datasource: '=',
				messageOptions: '=',
			},
			template: '<div class="chat-box">\
									<resize-edge direction="top" ng-if="!isMinimized"></resize-edge>\
									<resize-edge direction="left" ng-if="!isMinimized"></resize-edge>\
									<resize-edge corner="true" ng-if="!isMinimized"></resize-edge>\
									<div class="chat-header">{{ ::roomName }}<i class="icon ion-close" ng-click="hide()"></i><i class="icon ion-minus" ng-click="minimize()" ng-if="!isMinimized"></i><i class="icon ion-plus" ng-click="maximize()" ng-if="isMinimized"></i></div>\
									<div class="chat-content" ui-scroll-viewport ngf-drop ngf-multiple="true" ng-model="files">\
										<group-tag class="group-tag-sm" name="{{ \'NOMESSAGE\' | translate }}" ng-if="!roomObj.viewMessages.length"></group-tag>\
										<div ui-scroll="message in datasource" adapter="msgAdapter" class="message-wrapper" on-hold="onMessageHold($event, $index, message)" id="item-{{ message.id }}" attr-idx="{{$index}}" ng-transclude></div>\
									</div>\
									<form name="sendMessageForm" ng-submit="sendMessage()" novalidate>\
										<div class="bar bar-stable bar-footer item-input-inset message-footer" keyboard-attach>\
											<div class="footer-btn-wrap">\
												<button class="button button-icon ion-plus footer-btn" type="button"></button><input type="file" id="uploadFiles" multiple>\
											</div>\
											<label class="item-input-wrapper">\
												<textarea ng-model="input.text" value="" placeholder="Send {{toUser.username}} a message..." required minlength="1" maxlength="1024" msd-elastic ng-trim="false"></textarea>\
											</label>\
											<div class="footer-btn-wrap">\
												<button class="button button-icon ion-android-send footer-btn" type="submit" ng-disabled="!input.text || input.text === \'\'">\
												</button>\
											</div>\
										</div>\
									</form>\
								</div>',
			link: function(scope, elem, attrs) {
				var $contentEl = angular.element(elem[0].querySelector('.chat-content'));
				var $footerEl = elem.find('form');
				var $fileUploadEl = angular.element(elem[0].querySelector('#uploadFiles'));
				var unreadInit = false;
				/* Scope variables */
				// scope.roomObj = {}; // Test use
				scope.input = {};
				scope.toUser = scope.roomObj.type === 'private' ? scope.roomName : $filter('translate')('MEMBERS');
				scope.dropOptions = {
					onDrop: function(event) {
						console.log('onDrop');
						console.log(event);
					},
					onOver: function(event) {
						console.log('onOver');
						console.log(event);
					}
				};

			  /* Functions */
			  // Appending the message to ui-scroll list
			  function appendMessage(message) {
			    if (!unreadInit) {
			      unreadInit = true;
			      scope.datasource._revision++;
			      // Scrolling to the start of unread messages.
			      $location.hash('unreadStart');
			      $anchorScroll();
			      console.log('scrolling to unreadStart');
			    }
			    scope.msgAdapter.applyUpdates(function(item, _scope) {
			      // console.log(scope.roomObj.viewMessages.length);
			      // console.log('applyUpdates');
			      // console.log(_scope.$index);
			      if ( _scope.$index === scope.roomObj.viewMessages.length ) {
			      	console.log(item);
			        return [item, message];
			      }
			    });
			    RoomService.grouping(scope.roomObj);
			  }
			  function onFilesChanged() {
			  	var reader = new FileReader();
					var startIdx = 0;
					reader.onload = function(loadEvent) {
						scope.$apply(function() {
							$chatbox.upload(scope.files[startIdx].name, loadEvent.target.result)
								.then(function(response) {
									console.log(response);
									// TODO: send Message
									// var fileInfo = response.data.split(';');
									// var filename = fileInfo[0];
									// var fileId = fileInfo[0];
									// scope.input.text = filename;
									// scope.input.srcId = fileId;
									// scope.input.type = scope.files[startIdx].type;
									// scope.input.size = scope.files[startIdx].size;
									// sendMessage();
								}, function(err) {
									console.error(err);
								});
							startIdx++;
							(startIdx < scope.files.length) && reader.readAsArrayBuffer(scope.files[startIdx]);
						});
					};

					(startIdx < scope.files.length) && reader.readAsArrayBuffer(scope.files[startIdx]);
			  }

			  /* Scope Methods */
				scope.minimize = function() {
					$contentEl.css('display', 'none');
					$footerEl.css('display', 'none');
					elem.addClass('minimize');
					scope.isMinimized = true;
				};
				scope.maximize = function() {
					$contentEl.css('display', 'block');
					$footerEl.css('display', 'block');
					scope.isMinimized = false;
					elem.removeClass('minimize');
				};
				scope.sendMessage = function() {
					$checkFormat.isLink(scope.input) && (scope.input.type = METATYPE.LINK);
			    scope.input.roomId = scope.roomObj.id;
			    scope.input.ownerId = scope.currentUser.id;

			    RoomService.createMessage(scope.input);

			    scope.input = {};
				};

				$timeout(function() {
					scope.hide = function() {
						$chatbox.getInstanceById(scope.id).hide().then(scope.maximize);
					};
				}, 200);

				/* Event Listeners */
				scope.$on('onNewMessage', function(event, args) {
    			appendMessage(args.msg);
				});

				$fileUploadEl.on('change', function(event) {
					scope.files = {};
					scope.files = event.target.files;
					onFilesChanged();
				});
				scope.$watch('files', function(newVal) {
					// Process only on drop event.
					if (angular.isArray(newVal)) {
						onFilesChanged();
					}
				});

			}
		};
	}]);
	jangularUI.factory('$chatbox', ['$jgTemplate', '$document', '$compile', '$timeout', '$q', function($jgTemplate, $document, $compile, $timeout, $q) {
		var _self = this;

		var _instances = {};
		var _uploadUrl = null;

		_self.fromTemplateUrl = function(url, options) {
			return $jgTemplate.fetchTemplate(url).then(function(templateString) {
				return createChatbox(templateString, options);
			});
		};

		function show() {
			var self = this;

			// Append to container.
			self.$wrapper.append(self.el);

			self.$el.css('display', 'inline-block');
			self._isShown = true;

			self.$chatbox.addClass('ng-enter')
             		.removeClass('ng-leave ng-leave-active');

      $timeout(function() {
      	self.$chatbox.addClass('ng-enter-active');
      });
		}
		function hide() {
			var self = this;

			self.$chatbox.addClass('ng-leave');

      $timeout(function() {
      	self.$chatbox.addClass('ng-leave-active')
      						.removeClass('ng-enter ng-enter-active');
      }, 20);

			self._isShown = false;

			return $timeout(function() {
				self.$el.css('display', 'none');
      }, self.hideDelay || 20);
		}
		function isShown() {
			return this._isShown;
		}

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

	  function createChatbox(templateString, options) {
	  	if (!options.roomObj) {
	  		throw 'No object of the room specified';
	  	}
	  	var scope = options.scope && options.scope.$new() || $rootScope.$new(true);

	  	scope.roomObj = options.roomObj;
	  	var datasource = {
		    _revision: 0,
		    get: function(index, count, success) {
		      var delay = 10;
		      $timeout(function() {
		        // console.log(index);
		        index--;
		        if (scope.roomObj.viewMessages) {
		          if (index < 0) {
		            count = count + index;
		            index = 0;
		            if (count <= 0) {
		              success([]);
		              return;
		            }
		          }
		          success(scope.roomObj.viewMessages.slice(index, index+count));
		        }
		      }, delay);
		    },
		    revision: function() {
		      return datasource._revision;
		    }
		  };
		  scope.datasource = datasource;
		  scope.currentUser = options.currentUser;
		  scope.roomName = options.roomName;
		  scope.msgOptions = options.msgOptions;
		  scope.msgAdapter = {};
		  _uploadUrl = options.uploadUrl;

	  	var $element = angular.element(templateString);
	  	$element.attr('current-user', 'currentUser');
	  	$element.attr('room-obj', 'roomObj');
	  	$element.attr('title', options.roomName);
	  	$element.attr('message-options', 'msgOptions');
	  	// ID for the chat box element
	  	var id = hashCode(options.roomName);
	  	$element.attr('id', id);
	  	// Datasource(messages) of chat room.
	  	$element.attr('datasource', 'datasource');
	  	var element = $compile($element)(scope);
	  	var container = document.getElementById(options.container) || document.body;
	  	var wrapper = document.querySelector('.chat-panel');
	  	var $wrapper = angular.element(wrapper || '<div class="chat-panel"></div>');
			angular.element(container).append($wrapper);
	  	var $chatboxEl = angular.element(element[0].querySelector('.chat-box'));
	  	var pos = options.position || 'bottom';
	  	$wrapper.addClass('panel-'+pos);

	  	var chatbox = {
	  		id: id,
	  		$el: element,
	  		el: element[0],
	  		$wrapper: $wrapper,
	  		wrapper: $wrapper[0],
	  		$chatbox: $chatboxEl,
	  		scope: scope,
	  		show: show,
	  		hide: hide,
	  		isShown: isShown,
	  		remove: remove
	  	};

	  	_instances[id] = chatbox;
	  	return chatbox;
	  }

	  _self.getInstanceById = function(id) {
	  	return _instances[id];
	  };

	  _self.upload = function(filename, filecontent) {
	  	if (!_uploadUrl) throw "ERROR: No upload url specified";
	  	var xhr = new XMLHttpRequest;
     	xhr.open("POST", _uploadUrl+'?fileName=' + filename);
     	return $q(function (resolve, reject) {
        xhr.onload = function () {
        	console.log(xhr.responseText);
        	resolve(xhr.responseText);
       	};
       	xhr.onerror = reject;
       	xhr.onprogress = function(event) {
       		if (event.lengthComputable) 
			  	{ 
			    	var percentComplete = (event.loaded / event.total)*100;  
			    	// TODO: Update view
			  	} 
       	};
       	xhr.send(filecontent);
     	});
	  };

		return _self;
	}]);

	return jangularUI;
})();