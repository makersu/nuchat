/**
 *  (Partial) Jangular UI directives
 *  @author   James Hsiao
 *  @lib      Ionic App Labs
 *
 *  Include:
 *  1) Meta-Message
 */
(function() {
	var jangularUI = angular.module('jangular.ui', []);

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
			return content.match(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:\/~\+#]*[\w\-\@?^=%&amp;\/~\+#])?/);			
		}
	}

	function isImg(content) {
		if (content) {
			var ext = content.substr(content.lastIndexOf('.'));
			if ( ext.match(/jpg|jpeg|png|bmp|gif|tiff|tif|svg/) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Meta Message
	 * 
	 * Support types:
	 * 1) Hyper-link
	 * 2) Image: jpg|jpeg|png|bmp|gif|tiff|tif|svg
	 */
	jangularUI.directive('metaMsg', function($http, $q, $compile, $urlView) {
		return {
			restrict: 'EA',
			scope: {
				msg: '=',
				type: '=',
			},
			template: '<div ng-bind-html="message"></div>',
			link: function(scope, elem, attrs) {
				scope.message = angular.copy(scope.msg);
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
							break;
						case METATYPE.VIDEO:
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
					} else if (isImg(scope.message)) {
						parseImg();
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
									console.log('url property: '+property);
									console.log('url content: '+content);
									obj.url = content;
								}
								break;
						}
					}
				}

				// Assuming the img uri provided.
				function parseImg() {
					scope.message = '<img src="'+scope.message+'">';
				}

				// Output error logs
				function errorHandler(err) {
					console.error(err);
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
  			scope.content.comment = scope.content.url.substring(0, scope.content.url.lastIndexOf('/')).replace(/(http|ftp|https):\/\//gi, '');
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

	return jangularUI;
})();