/* Content Management Service */
function CMService($rootScope, $http, $filter, $q, $window, $timeout,
									 $db, $wns, $settings, $utils, $taskQueue, $sce,
									 FILETYPE, DOC_TYPE, TEMP_IMG, WRS_PART_SIZE, TABLE_MODEL,
									 $cordovaFile, $cordovaFileTransfer, $cordovaNetwork) {
	var _self = this;

	var DEBUG = false;
	var PAGESIZE = 100;
	var INIT_WALL_SIZE = 5;
	var READMORE_THRESHOLD = 100;
	var REFRESH_THRESHOLD = 10;
	var newComming = 0;

	var currentPath = '/';
	var _fileList = [];

	_self.apis = {
		login: '/Site_Prog/login.php',
		logout: '/Site_Prog/logout.php',
		driveHelper: '/tools/api_tools.php',
		thumb: '/tools/page/show_page.php',
		edit: '/Site_Prog/API/edit_api.php',
		edit_part: '/Site_Prog/API/edit_api_p.php',
		delete: '/API/trash_api.php',
		share: '/API/share_api.php',
		usrInfo: '/tools/api_user_info.php',
		usrImg: '/UserProfile/user_image.php',
		bbs: 'index.php',
		urlCache: '/tools/api_url_cache.php'
	};
	_self.contentSrc = null;
	_self.tagList = {};
	_self.selectedTagList = {};
	_self.fileList = [];	// Public list of fileList.
	_self.article = {};
	// All resources
	_self.allResType = null;
	_self.allResGroupBy = null;
	_self.groupedList = null;
	_self.prevGroup = null;

	/* Methods */
	// Private
	var errorHandler = function(error) {
		return error;
	};
	var errorOutputHandler = function(error) {
		console.error(error);
	};
	// To check the local and remote files if need to be updated
	var shouldUpdate = function(file, newFile) {
		// Checking the filename, time, tag, viewPath, and pws(priviledges).
		return file.filename != newFile.filename ||
					 file.time != newFile.time ||
					 file.tag != newFile.tag ||
					 file.view_path != newFile.view_path ||
					 (newFile.bAdmin && file.bAdmin != newFile.bAdmin) ||
					 (newFile.PW_bDownload && file.PW_bDownload != newFile.PW_bDownload) ||
					 (newFile.PW_bEdit && file.PW_bEdit != newFile.PW_bEdit) ||
					 (newFile.PW_bUpload && file.PW_bUpload != newFile.PW_bUpload) ||
					 (newFile.PW_bView && file.PW_bView != newFile.PW_bView);
	};
	var getFileArrayBuffer = function(file) {
		var q = $q.defer();
		var reader = new FileReader();
		reader.onload = function(event) {
			file.blob = new Blob([new Uint8Array(event.target.result)]);
			if (DEBUG) console.log('file size: '+file.size+', blob size: '+file.blob.size);
			q.resolve(file);
		};
		reader.readAsArrayBuffer(file);
		return q.promise;
	};
	var getFilePart = function(file, partPos, partSize) {
		var q = $q.defer();

		var fStart = partPos * partSize;
		var fEnd = Math.min(fStart+partSize, file.size);
		return file.blob.slice(fStart, fEnd);
	};
	var uploadPart = function(filePart, px, path, filename) {
		var q = $q.defer();
		var fData = new FormData();
		fData.append('mode', 	'up_f_p');
		fData.append('site', 	'Site');
		fData.append('code', 	'nuweb_editpass');
		fData.append('path', 	path);
		fData.append('name', 	filename);
		fData.append('px', 		px+1);
		fData.append('file', 	filePart);
		if (DEBUG) console.log(filePart);

		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {            
			if (xhr.readyState == 4) {
				if (DEBUG) console.log('fileUpload_obj_api_Part'
																+", px="+(px+1)
																+", status="+xhr.status
																+", responseText="+xhr.responseText);

				if (xhr.status == 200) {
					q.resolve(xhr.responseText || "OK");
				}
				else {
					var sErr;
					if (xhr.status == 0)
						sErr = xhr.status+", 連線失敗";	// 連線失敗
					else
						sErr = xhr.status+", "+xhr.responseText;
					q.reject(sErr);
				}
				// 上傳完成
				//console.log('Successfully uploaded');
			}
		};
		xhr.upload.addEventListener("progress", function(event) {
			if (event.lengthComputable) {
				var progress = event;
				q.notify(progress);
			}
		}, false);
		xhr.open(
			'POST',
			_self.getCurrentSrvUrl() + _self.apis.edit_part
		);
		//xhr.setRequestHeader("Cache-Control", "no-cache");
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.send(fData);

		return q.promise;
	};
	var continueUpload = function(file, parts, px, options, q) {
		if (!q) {
			q = $q.defer();
		}
		// Totally uploaded, check the completion.
		if (px >= parts.length) {
			_self.checkFilePartUpload(file)
				.then(function(response) {
					if (DEBUG) console.log('Final check');
					q.resolve(response);
				}, function(error) {
					q.reject(error);
				});
			return q.promise;
		}

		// Already uploaded, go next.
		if (parts[px] == '1') {
			px++;
			return continueUpload(file, parts, px, options, q);
		}

		var filePart = getFilePart(file, px, WRS_PART_SIZE);
		uploadPart(filePart, px, options.path, options.name)
			.then(function(response) {
				// Next upload
				px++;
				return continueUpload(file, parts, px, options, q);
			}, function(error) {
				q.reject('Part '+px+' upload error: '+error);
				// Retry upload
				return continueUpload(file, parts, px, options, q);
			}, function(progress) {
				var updateProgress = {};
				updateProgress.total = file.size;
				updateProgress.loaded = px*WRS_PART_SIZE+progress.loaded;
				q.notify(updateProgress);
			});
		return q.promise;
	};
	// Reading the file list from local DB by type
	var getAllResourcesLocal = function(type, srv) {
		var q = $q.defer();
		var where = 'type="'+type+'" AND acn="'+$wns.getAcnInfo().acn+'" AND srv="'+srv.cs+'" AND site="'+srv.acn+'"';
		$db.query('files', ['*'], where)
				.then(function(results) {
					if (results.length) {
						var fileList = [];
						for (var i = 0; i < results.length; i++) {
							fileList.push(results.item(i));
						}
						q.resolve(fileList);
					} else {
						q.resolve(null);
					}
				}, function(error) {
					q.reject('Query local resources['+type+'] ERROR: '+error);
				});
		return q.promise;
	};
	// Get all resources by type: image, video, audio, document
	var getAllResources = function(type, srv) {
		var acnPath = '/Site/'+srv.acn;
		var promise = $http.get( srv.url + _self.apis.driveHelper, 
											{ params: { mode: 'search', act: 'all', file_path: acnPath,
																	type: type, sort: 'time', order: 'dec',
																	p: 1, ps: PAGESIZE, fc: 1 }
											} )
				.then(function(response) {
					return response.data.recs;
				}, errorHandler);
		return promise;
	};
	// Getting resource file list from the cloud server.
	var getAllResourcesFromSrv = function(type, srv) {
		var q = $q.defer();

		if (srv && $cordovaNetwork.isOnline()) {
			if (DEBUG) console.log('Auto downloading '+srv.cs+' type: '+type);
			getAllResources(type, srv)
  			.then(function(fileList) {
  				// _self.allResources[type] = [];
  				var allResources = [];
  				angular.forEach(fileList, function(file) {
  					//  TODO: check DB if file not exist or updated
  					// Check if ignore path
  					if (file && !_self.isIgnore(file)) {
  						// console.log(file);
  						var fileDir = file.url.replace('/Site/', '');
  						fileDir = fileDir.substring(0, fileDir.lastIndexOf('/'));
  						file.dir = fileDir;
  						file.srv = srv.cs;
  						file.site = srv.acn;
  						file.filename = file.filename.replace(/'/g, '\\\'').replace(/"/g, '\'');
							file.description = file.description.replace(/'/g, '\\\'').replace(/"/g, '\'');
							file.view_path = file.view_path.replace(/'/g, '\\\'').replace(/"/g, '\'');
							file.bAdmin = file.PW_bView = file.PW_bUpload = file.PW_bDownload = file.PW_bEdit = true;
							if (!file.info) {
								file.info = $filter('translate')('SIZE')+'：'+$filter('byteFormat')(file.size, 1);
							}
  						allResources.push(file);
  					}
  				});
					// i++;
					// return getAllResourcesFromSrv(srvList, i, type, q);
					q.resolve(allResources);
  			}, function(error) {
  				q.reject(error);
  			});
		} else {
			q.resolve(null);
		}
		return q.promise;
	};
	// Downloading the resource from the cloud.
	_self.downloadResource = function(cacheDir, file) {
		var q = $q.defer();
		var fNameParts = file.page_name.split('.');
		var fileName = fNameParts[0];
		var extension = fNameParts[1];
		var quality = $settings.config.thumb_quality;
		var savePath = cacheDir+fileName+'.cache.'+extension;
		if (file.type == FILETYPE.img) {
			_self.downloadThumb(file.url, savePath, $settings.config.thumb_quality)
				.then(function(response) {
					// Updating DB
					file.cachedPath = savePath;
					_self.updateFile(file)
						.then(function(res) {
							q.resolve();
						}, function(error) {
							q.reject('Updating the cached info of the image resource "'+file.view_path+'" into DB ERROR: '+error);
						});
				}, function(error) {
					console.error('Get all resources[image] ERROR: '+file.page_url+' error log: '+error);
				});
		} else {
			_self.downloadFile(file.url, savePath)
				.then(function(response) {
					// Updating DB
					file.cachedPath = savePath;
					// console.log(file);
					_self.updateFile(file)
						.then(function(res) {
							q.resolve();
						}, function(error) {
							q.reject('Updating the resource cached info "'+file.view_path+'" into DB ERROR: '+error);
						});
				}, function(error) {
					console.error('Get all resources['+type+'] ERROR: '+file.page_url+' error log: '+error);
				});
		}
		return q.promise;
	};
	// Downloading the file thumb if has.
	var downloadResourceThumb = function(cacheDir, file) {
		var q = $q.defer();
		// Download if image or video
		if (file.thumbs) {
			var path2Save = cacheDir+file.page_name;
			_self.downloadThumb(file.url, path2Save)
						.then(function(fileEntry) {
							if (DEBUG) console.log('Downloading the resource "'+file.filename+'" thumb successfully.');
							file.thumbCache = path2Save;
							_self.updateFile(file)
								.then(function(res) {
									if (DEBUG) console.log(res);
									// $rootScope.$broadcast('localRefresh');
									q.resolve();
								}, function(err) {
									q.reject('Update resource table files ERROR: '+err);
								});
						}, function(error) {
							q.reject('Downloading the resource thumb "'+file.url+'" failed.');
						});
		} else if (file.type == FILETYPE.audio) {
			// Get the thumbnails from the ID3 tag
			//console.log(file);
			// _self.getCoverArt(file)
			// 		.then(function(image) {
			// 			callback();
			// 		}, function(error) {
			// 			callback('Fetching the cover art ERROR: '+error);
			// 		});
			q.resolve();
		} else {
			q.resolve();
		}
		return q.promise;
	};

	// To get the site root from the url
	var getSiteRootUrl = function(url) {
		var noScheme = url.replace(/(https?:\/\/)/, '');
		// console.log(noScheme.substring(0, noScheme.indexOf('/')));
		return noScheme.substring(0, noScheme.indexOf('/'));
	};

	// To get the cache view of the hyperlink and make it clickable
	var getLinkCacheView = function(record, cachedDir) {
		var q = $q.defer();
		var linkRegex = /(https?:\/\/.*)/gi;
		// console.log(record);
		var urls = record.description.match(linkRegex);
		if (DEBUG) console.log(urls);
		if (urls) {
			// Wrapping the a tag if no wrapped.
			angular.forEach(urls, function(url) {
				var startIdx = record.description.indexOf(url);
				// console.log(startIdx);
				// console.log(record.description);
				if (startIdx <= 8 || record.description.charAt(startIdx-1) != '"') {
					record.description = record.description.slice(0, startIdx)+
															'<a href="'+url+'">'+url+'</a>'+
															record.description.slice(startIdx+url.length);
				}
			});
			// Get the 1st cached view
			_self.getUrlCache(record, urls[0])
				.then(function(response) {
					record.cachedView = response;
					record.cachedView.siteRoot = getSiteRootUrl(response.url);
					// Downloading the main image to be cached on local
					var img2Download = response.img_main;
					var filename = img2Download.substr(img2Download.lastIndexOf('/')).replace(/[\?=]/g, '');
					// console.log(filename);
					if (!filename || filename == '' || filename.indexOf('/{{') >= 0) {
						if (response.imgs.length) {
							img2Download = response.imgs[0];
							filename = img2Download.substr(img2Download.lastIndexOf('/')).replace(/[\?=]/g, '');
						}
					}
					// console.log('Processed');
					// console.log(filename);
					if (filename && filename != '') {
						var savePath = cachedDir+filename;
						if (img2Download) {
							// console.log(img2Download);
							// console.log(savePath);
							$cordovaFileTransfer.download(img2Download, savePath, {}, true)
								.then(function(response) {
									// console.log(response);
									record.cachedView.img_main = savePath;
									q.resolve(record);
								}, function(error) {
									q.reject('Downloading the cover image of the link cache view ERROR: '+JSON.stringify(error));
								});
						} else {
							console.warn('No main image of cache view to download');
							q.resolve();
						}
					} else {
						// TODO: assigning the default image to img_main;
						q.resolve();
					}
				}, function(error) {
					q.reject('Getting the link cache view ERROR: '+error);
				});
		} else {
			console.log('Has no links in description');
			q.resolve();
		}
		return q.promise;
	};

	// Scope Public
	_self.init = function() {
		var q = $q.defer();
		if (!_self.contentSrc) {
			$wns.getCurrentSrv()
				.then(function(srv) {
					q.resolve(_self.contentSrc = srv);
				}, function(error) {
					q.reject('Initializing content manager ERROR: '+error);
				});
		} else {
			q.resolve(_self.contentSrc);
		}
		return q.promise;
	};
	_self.getUserInfo = function(acn) {
		var params = { mode: 'wns_acn2info', keyword: acn };
		var promise = $http.get( _self.getCurrentSrvUrl() + _self.apis.driveHelper,
													{ params: params } )
											.then(function(response) {
												return response.data;
											}, errorHandler);
		return promise;
	};
	_self.getUserHeadImg = function(acn, path2Save) {
		var promise = $cordovaFileTransfer.download( _self.getCurrentSrvUrl()+_self.apis.usrImg+'?acn='+acn, path2Save, {}, true )
											.then(function(response) {
												return response;
											}, errorHandler);
		return promise;
	}
	_self.getCurrentSrvUrl = function() {
		return _self.contentSrc.url;
	};
	_self.getFileUrl = function(file) {
		return _self.getCurrentSrvUrl()+file.url;
	};
	_self.getRandomPath = function(file) {
		var promise = $http.get( _self.getCurrentSrvUrl() + _self.apis.share, 
											{ params: { mode: 'set_share', value: 1, page_url: file.url } } )
										.then(function(response) {
											return response.data;
										}, errorHandler);
		return promise;
	};
	_self.getShortUrl = function(file, randomPath) {
		var serverAddress = _self.getCurrentSrvUrl();
		var promise = $http.get( serverAddress + _self.apis.driveHelper,
											{ params: { mode: 'short_code', act: 'get',
																	page_url: file.url+'&random_path='+randomPath
																}
											} ).then(function(response) {
												return $wns.dn+'/?link='+response.data;
											}, errorHandler);
		return promise;
	};
	_self.getFileShareUrl = function(file) {
		var q = $q.defer();
		_self.getRandomPath(file)
				.then(function(random) {
					_self.getShortUrl(file, random)
							.then(function(shortPath) {
								q.resolve(shortPath)
							}, function(error) {
								q.reject('Get short path of file ['+file.url+'] encountered an error: '+error);
							});
				}, function(error) {
					q.reject('Get file sharing url error: '+error);
				});
		return q.promise;
	};
	_self.getUrlCache = function(record, url) {
		var q = $q.defer();
		$http.get( record.srv.url+_self.apis.urlCache, { params: { mode: 'getUrlParse', url: url } } )
				.then(function(response) {
					q.resolve(response.data);
				}, function(error) {
					q.reject(error);
				});
		return q.promise;
	};

	_self.getCurrentSiteAcn = function() {
		if (_self.contentSrc.acn) {
			return _self.contentSrc.acn;
		}
		return null;
	};

	_self.getCurrentSitePath = function() {
		if (_self.getCurrentSiteAcn()) {
			return _self.getCurrentSiteAcn();
		}
		return null;
	};

	_self.getCurrentPath = function() {
		return currentPath;
	};
	_self.setCurrentPath = function(path) {
		currentPath = path;
	};

	_self.isIgnore = function(file) {
		var ignoreList = $settings.config.autoDownloadIgnoreList;
		var isIgnore = false;
		angular.forEach(ignoreList, function(ignore) {
			if (!isIgnore) {
				if (file.url.indexOf(ignore) == 0) {
					isIgnore = true;
				}
			}
		});
		return isIgnore;
	};

	var getResourcesByTypeFromSrv = function(type, srv, autoDownload) {
		var q = $q.defer();
		async.parallel([
			// Reading from DB.
			function(callback) {
				getAllResourcesLocal(type, srv)
					.then(function(localList) {
						// console.log('getResourcesByTypeFromSrv');
						// console.log(localList);
						q.resolve(localList);
						callback(null, localList);
					}, function(err) {
						callback(err);
					});
			},
			// Reading from cloud.
			function(callback) {
				if ($cordovaNetwork.isOnline()) {
					getAllResourcesFromSrv(type, srv)
						.then(function(remoteList) {
							callback(null, remoteList);
						}, function(err) {
							callback(err);
						});
				} else {
					callback(null, null);
				}
			}
		], function(err, results) {
			if (err) {
				q.reject(err);
			} else {
				// Comparing and updating DB.
				_self.checkUpdate(results[0], results[1])
					.then(function() {
						getAllResourcesLocal(type, srv)
							.then(function(latestList) {
								var currentSrvAcnDir = $rootScope.storeRoot+srv.cs+'/'+srv.acn+'/';
								angular.forEach(latestList, function(file) {
									// Not cached, then downloading using the task queue.
									if (autoDownload && !file.cachedPath) {
										$taskQueue.push(function() {
											return _self.downloadResource(currentSrvAcnDir, file);
										}, true);
									}
									// Downloading the resource thumb.
									if (file.type != FILETYPE.audio && file.type != FILETYPE.doc && file.type != FILETYPE.html && !file.thumbCache) {
										$taskQueue.push(function() {
											return downloadResourceThumb(currentSrvAcnDir, file);
										}, true);
									}
								});
								// q.resolve(latestList);
								$rootScope.$broadcast('localRefresh');
							}, function(err) {
								q.reject('Getting the resources['+type+'] on server "'+srv.acn+'.'+srv.cs+'" ERROR: '+err);
							});
					}, function(error) {
						q.reject(error);
					});
			}
		});
		return q.promise;
	};

	// For all resources pages use.
	_self.getCurrentSrvResourcesByType = function(type) {
		var q = $q.defer();
		$wns.getCurrentSrv()
			.then(function(srv) {
				getResourcesByTypeFromSrv(type, srv, false)
					.then(function(resources) {
						// console.log('getCurrentSrvResourcesByType');
						// console.log(resources);
						q.resolve(resources);
					}, function(err) {
						q.reject(err);
					})
			});
		return q.promise;
	};

	// For all resources pages use.
	_self.getCurrentSrvResourcesByTypeLocal = function(type) {
		var q = $q.defer();
		$wns.getCurrentSrv()
			.then(function(srv) {
				getAllResourcesLocal(type, srv)
					.then(function(localList) {
						q.resolve(localList);
					}, function(err) {
						q.reject(err);
					});
			}, function(err) {
				q.reject(err);
			});
		return q.promise;
	};

	// Start auto download, check the auto download setting and then call getAllResources by type.
	_self.autoDownloadByType = function(type) {
		var srvList = $settings.getAutoDownloadSrcList();
		var i = 0;
		if (DEBUG) console.log('Auto downloading: '+type);

		async.eachSeries(srvList, function(srv, eachCallback) {
			getResourcesByTypeFromSrv(type, srv)
				.then(function(resources) {
					if (DEBUG) console.log('Downloading resources['+type+'] from server "'+srv.acn+'.'+srv.cs+'"successfully');
					eachCallback();
				}, function(err) {
					eachCallback(err);
				});
			// // Parallel get local and remote files, then compare to update local DB.
			// async.parallel([
			// 	function(callback) {
			// 		console.log("get local resources");
			// 		// Reading file list from 
			// 		getAllResourcesLocal(type, srv)
			// 			.then(function(localList) {
			// 				callback(null, localList);
			// 			}, function(error) {
			// 				callback(error);
			// 			});
			// 	},
			// 	function(callback) {
			// 		console.log("get remote resources");
			// 		getAllResourcesFromSrv(type, srv)
			// 			.then(function(remoteList) {
			// 				callback(null, remoteList);
			// 			}, function(error) {
			// 				callback(error);
			// 			});
			// 	}
			// ], function(err, results) {
			// 	_self.checkUpdate(results[0], results[1])
			// 		.then(function(response) {
			// 			getAllResourcesLocal(type, srv)
			// 				.then(function(latestList) {
			// 					var currentSrvAcnDir = $rootScope.storeRoot+srv.cs+'/'+srv.acn+'/';
			// 					angular.forEach(latestList, function(file) {
			// 						// Not cached, then downloading using the task queue.
			// 						if (!file.cachedPath) {
			// 							$taskQueue.push(function() {
			// 								return downloadResource(currentSrvAcnDir, file);
			// 							});
			// 						}
			// 					});
			// 					eachCallback(null, srv);
			// 				}, function(err) {
			// 					eachCallback('Getting the resources['+type+'] on server "'+srv.url+'" ERROR: '+err);
			// 				});
			// 		})
			// });
		}, function(err) {
			if (err) {
				console.error(err);
			} else {
				var log = 'Downloading resources['+type+'] from servers "';
				angular.forEach(srvList, function(srv) {
					log += srv.url+', ';
				});
				log = log.substring(0, log.length-2) + '"successfully';
				if (DEBUG) console.log(log);
			}
		});
	};
	_self.startAutoDownload = function() {
		if ( $cordovaNetwork.isOnline() &&
					( !$settings.config.auto_download_wifi_only ||
						($settings.config.auto_download_wifi_only && $cordovaNetwork.getNetwork() == Connection.WIFI) )
			 ) {
			// Automatically download html articles?
			_self.autoDownloadByType(FILETYPE.html);

			if ($settings.config.auto_download_imgs) {
				_self.autoDownloadByType(FILETYPE.img);
			}
			if ($settings.config.auto_download_music) {
				_self.autoDownloadByType(FILETYPE.audio);
			}
			if ($settings.config.auto_download_videos) {
				_self.autoDownloadByType(FILETYPE.video);
			}
			if ($settings.config.auto_download_docs) {
				_self.autoDownloadByType(FILETYPE.doc);
			}
		} else {
			console.log('Donnot start auto downloading');
		}
	};
	// Start the auto uploading tasks
	_self.startAutoUpload = function() {
		console.log('Start fake auto uploading');
		if ( $cordovaNetwork.isOnline() &&
				 ( !$settings.config.auto_upload_wifi_only ||
				 	 ($settings.config.auto_upload_wifi_only && $cordovaNetwork.getNetwork() == Connection.WIFI) )
			 ) {
			// TODO: autoUploadByType
			if ($settings.config.auto_upload_imgs) {

			}
			if ($settings.config.auto_upload_music) {

			}
			if ($settings.config.auto_upload_videos) {

			}
		}
	}

	// Upload a file
	_self.uploadFile = function(file, srv) {
		var q = $q.defer();
		var apiUrl = ( srv ? srv.url : _self.getCurrentSrvUrl() ) + _self.apis.edit;
		var params = { mode: 'upload_file', path: currentPath, code: 'nuweb_editpass', name: file.filename };
		if (file.size > 10 * 1024 * 1024) { // If size > 10M, upload by parts
			_self.checkFilePartUpload(file)
				.then(function(response) {
					var parts = response.data;
					// console.log(parts);
					// console.log('Path to save: '+currentPath);
					if (parts.indexOf('0') == 0 || parts.indexOf('1') == 0) {
						getFileArrayBuffer(file)
							.then(function(updateFile) {
								//console.log(file);
								continueUpload(file, parts, 0, { path: currentPath, name: file.filename })
									.then(function(response) {
										$rootScope.$broadcast('updateList');
										q.resolve(response);
									}, function(error) {
										q.reject(error);
									}, function(progress) {
										q.notify(progress);
									});
							});
					}
				}, errorHandler);
		} else {
			$cordovaFileTransfer.upload( apiUrl, file.localURL, { params: params }, true)
							.then(function(response) {
								$rootScope.$broadcast('updateList');
								q.resolve(response);
							}, function(error) {
								q.reject(error);
							}, function(progress) {
								q.notify(progress);
							});
		}
		return q.promise;
	};
	_self.checkFilePartUpload = function(file) {
		var q = $q.defer();
		var apiUrl = _self.getCurrentSrvUrl() + _self.apis.edit_part;
		var params = { mode: 'up_f_pl', path: currentPath, code: 'nuweb_editpass', name: file.filename, fs: file.size, ps: WRS_PART_SIZE, act: 'new' };
		$http.get( apiUrl, { params: params } )
				.then(function(response) {
					q.resolve(response);
				}, errorHandler);

		return q.promise;
	};

	_self.getAllFileList = function() { _self.fileList = _fileList; return _fileList; };
	// Use randomPath to get the shared file list
	_self.getFileList = function(dir, ignores, pws, randomPath) {
		if (DEBUG) console.log(dir);
		var q = $q.defer();
		var params = { mode: 'search', act: 'all', file_path: dir, dir: dir,
									 sort: 'time', order: 'dec', p: 1, ps: PAGESIZE,
									 o_fields: 'url,filename,page_name,size,owner,last_acn,time,mtime,description,content,dir_type,type,tag,md5,thumbs,view_path' };
		if (randomPath) params.random_path = randomPath;
		$http.get( _self.getCurrentSrvUrl() + _self.apis.driveHelper, { params: params } )
				.then(function(response) {
					if (DEBUG) console.log(response);
					_fileList = $filter('ingnoreFiles')(response.data.recs, ignores);
					// Updating the data format to apdapt the DB.
					angular.forEach(_fileList, function(file) {
						file.srv = _self.contentSrc.cs;
						file.site = _self.contentSrc.acn;
						file.dir = dir;
						file.filename = file.filename.replace(/'/g, '\\\'').replace(/"/g, '\'');
						file.description = file.description.replace(/'/g, '\\\'').replace(/"/g, '\'');
						file.view_path = file.view_path.replace(/'/g, '\\\'').replace(/"/g, '\'');
						angular.forEach(pws, function(val, key) {
							file[key] = val ? 1 : 0;
						});
					});
					q.resolve(_fileList);
				}, function(error) {
					q.reject(error);
				});
		return q.promise;
	};
	_self.setFileList = function(list) {
		_fileList = list;
	};
	// Getting the file list from the local DB.
	_self.getFileListLocal = function(dir) {
		var q = $q.defer();
		$db.query('files', ['*'], 'acn="'+$wns.getAcnInfo().acn+'" AND srv="'+_self.contentSrc.cs+'" AND dir="'+dir+'" AND type!="'+FILETYPE.indexContent+'"')
			.then(function(results) {
				if (results.length) {
					var fileList = [];
					for (var i = 0; i < results.length; i++) {
						fileList.push(results.item(i));
					}
					_self.setupTagList(fileList);
					q.resolve( $filter('tagFilter')(_self.fileList, _self.selectedTagList) );
				} else {
					q.resolve(null);
				}
			}, function(err) {
				q.reject('Query ERROR: '+err);
			});
		return q.promise;
	};
	// Comparing the file list read from DB and the remote file list and updating the file records
	// @return updated file list.
	_self.checkUpdate = function(localList, newList) {
		var q = $q.defer();
		if (newList) {
			var tempList = angular.copy(localList);
			async.eachSeries(newList, function(file, callback) {
				var toUpdate = $filter('filter')(tempList, { url: file.url });
				if (toUpdate && toUpdate.length) {	// Existing file
					// Processing, remove it from the list.
					var fileIdx = tempList.indexOf(toUpdate[0]);
					tempList.splice(fileIdx, 1);
					// To check if need to be updated.
					if (shouldUpdate(toUpdate[0], file)) {
						if (toUpdate[0].cachedPath) {
							var cacheDir = $rootScope.storeRoot+file.srv+'/'+file.site+'/';
							$taskQueue.push(function() {
								return _self.downloadResource(cacheDir, file)
							}, true);
						}
						// Updating DB.
						_self.updateFile(file)
							.then(function(res) {
								callback();
							}, function(err) {
								callback('Update DB ERROR: '+err+', file: '+JSON.stringify(file));
							});
					} else { // Do not need to update, skip.
						callback();
					}
				} else {	// New file
					_self.updateFile(file)
						.then(function(res) {
							callback();
						}, function(err) {
							callback('Update DB with new file ERROR: '+err+', file: '+JSON.stringify(file));
						});
				}
			}, function(err) {
				if (err) {
					q.reject(err);
				} else {
					if (tempList && tempList.length) {
						async.each(tempList, function(file, callback) {
							$db.delete('files', 'acn="'+$wns.getAcnInfo().acn+'" AND url="'+file.url+'" AND srv="'+file.srv+'" AND site="'+file.site+'"')
								.then(function() {
									callback();
								}, function(err) {
									callback('Delete file in DB ERROR: '+err);
								});
						}, function(err) {
							if (err) console.error(err);
							else console.log('All redundant files have been deleted.');
						});
					}
					q.resolve(newList);
				}
			});
		} else {
			q.resolve(localList);
		}
		// } else {
		// 	async.eachSeries(newList, function(file, callback) {
		// 		_self.updateFile(file)
		// 			.then(function(res) {
		// 				callback();
		// 			}, function(err) {
		// 				callback('Update DB ERROR: '+err+', file: '+JSON.stringify(file));
		// 			});
		// 	}, function(err) {
		// 		if (err) {
		// 			q.reject(err);
		// 		} else {
		// 			q.resolve();
		// 		}
		// 	});
		// }
		return q.promise;
	};
	// Setup tag list
	_self.setupTagList = function(fileList) {
		var tagList = {};
		_self.fileList = [];
		angular.forEach(fileList, function(file) {
			var tags = file.tag.split(',');
			angular.forEach(tags, function(tag) {
				if (tag !== '' && tag !== 'SYS_HIDE') {
					if (tagList[tag]) {
						tagList[tag].count++;
					} else {
						tagList[tag] = { count: 1 };
					}
				}
			});
			_self.fileList.push(file);
		});
		if (Object.getOwnPropertyNames(_self.tagList) == 0) {
			_self.tagList = tagList;
		}
	}

	// Get html content remotely
	_self.getHtmlContent = function(file) {
		var q = $q.defer();
		$http.get( _self.getCurrentSrvUrl() + _self.apis.driveHelper,
					{ params: { mode: 'file', act: 'GetPageInfo',
											file_path: file.url, get_content: 'y'}
					} ).then(function(response) {
						var priviledges = _self.setPWS(response.data);
						file.content = _self.setArticleByPageInfo(response.data);
						// Updating db
						if (file.content) {
							// Stringify the JSON object
							file.srv = _self.contentSrc.cs;
							file.site = _self.contentSrc.acn;
							file.content = JSON.stringify(file.content);
							file.content = file.content.replace(/'/g, '\\\'').replace(/"/g, '\'');
							file.cachedPath = 'content';
							if (DEBUG) console.log(file.content);
							// console.log(file);
							// delete file.tempImg;
							_self.updateFile(file)
								.then(function(res) {
									q.resolve({ pws: priviledges, content: file.content });
								}, function(err) {
									q.reject('Update index.html into DB ERROR: '+err);
								});
						}
					}, function(error) {
						q.reject('Get HTML content error: '+error);
					});
		return q.promise;
	};
	// Get html content from db
	_self.getHtmlContentLocal = function(file) {
		var q = $q.defer();
		$db.query('files', ['content'], 'acn="'+$wns.getAcnInfo().acn+'" AND srv="'+file.srv+'" AND url="'+file.dir+'"')
			.then(function(result) {
				if (result.length) {
					var htmlFile = result.item(0);
					if (DEBUG) console.log(htmlFile.content);
					var article = _self.parseHtmlContent(htmlFile);
					q.resolve(article);
				} else {
					q.resolve(0);
				}
			});
		return q.promise;
	};
	_self.parseHtmlContent = function(file) {
		return angular.fromJson(eval('('+file.content+')'));
	};
	// Set article object from the repsonse of api_tools: getPageInfo
	_self.setArticleByPageInfo = function(data) {
		_self.article = { content: data.content, title: data.rec.title, author: data.user_sun, time: data.rec.time };
		return _self.article;
	};
	_self.setArticle = function(article) {
		_self.article = article;
	};
	// Setting the priviledges from the page info api
	_self.setPWS = function(data) {
		var priviledges = {}
		priviledges.bAdmin = data.bAdmin;
		priviledges.PW_bDownload = data.PW_bDownload;
		priviledges.PW_bEdit = data.PW_bEdit;
		priviledges.PW_bUpload = data.PW_bUpload;
		priviledges.PW_bView = data.PW_bView;
		return priviledges;
	};

	// Tag actions
	_self.getListByTags = function(tags) {
		_self.fileList = $filter('tagFilter')(_fileList, tags);
		return _self.fileList;
	};

	// Get all qulaity paths of the video file
	_self.getPlayStreamUrl = function(path) {
		var promise = $http.get( _self.getCurrentSrvUrl() + _self.apis.driveHelper,
											{ params: { mode: 'file', act: 'GetPlayList', file_path: path } } )
				.then(function(response) {
					return response.data.mp4_list;
				}, errorHandler);
		return promise;
	};

	_self.attemptLoginDrive = function(srvUrl) {
		if (angular.isUndefined(srvUrl)) {
			srvUrl = _self.getCurrentSrvUrl();
		}
		var promise = $http.get( srvUrl + _self.apis.login,
              { params: { acn: $wns.getAcnInfo().acn, pwd: $wns.getAcnInfo().pwd_raw, group_login: -1 } } )
        .then(function(response) {
          //console.log(response);
          return response.data;
        }, errorHandler);
    return promise;
	};

	// Logout account to clear all cookies and seesions.
	_self.logout = function() {
		var q = $q.defer();
		$wns.getCurrentSrv()
			.then(function(srv) {
				$http.get( srv.url + _self.apis.logout )
					.then(function(repsonse) {
						q.resolve();
					}, errorOutputHandler);
			}, function(error) {
				q.reject('Getting current server while logging out ERROR: '+error);
			})
		return q.promise;
	};

	/*
	 * Setting the temporary thumb image by type.
	 */
	_self.setTempThumb = function(file) {
		var img = TEMP_IMG.unknown;
		switch (file.type) {
			case FILETYPE.img:
				img = TEMP_IMG.photo;
				break;
			case FILETYPE.audio:
				img = TEMP_IMG.music;
				break;
			case FILETYPE.video:
				img = TEMP_IMG.video;
				break;
			case FILETYPE.doc:
				var ext = file.filename.substr(file.filename.lastIndexOf('.'));
				ext = ext.substr(1);
				switch ($utils.getDocType(ext)) {
					case DOC_TYPE.word:
						img = TEMP_IMG.word;
						break;
					case DOC_TYPE.excel:
						img = TEMP_IMG.excel;
						break;
					case DOC_TYPE.pdf:
						img = TEMP_IMG.pdf;
						break;
				}
				break;
			case FILETYPE.text:
				img = TEMP_IMG.txt;
				break;
			case FILETYPE.html:
				img = TEMP_IMG.html;
				break;
			case FILETYPE.link:
				img = TEMP_IMG.url;
				break;
		}
		file.tempImg = img;
	};
	/* 
	 * Download image thumb
	 * params: path      - relative path, ex: /Site/site_name/filename
	 *         path2Save - absolute path of local, ex: file://data/data/package/folder_hierarchy/filename
	 *         quality   - specific quality number of the image to download, could be 300, 640, 1920, default: null.
	 */
	_self.downloadThumb = function(path, path2Save, quality) {
		var promise = _self.downloadThumbOnSrv(_self.getCurrentSrvUrl(), path, path2Save, quality);
		return promise;
	};
	_self.downloadThumbOnSrv = function(srvUrl, path, path2Save, quality) {
		var imgUrl = srvUrl + _self.apis.thumb + '?page_url=' + path + (quality ? '.'+quality : '') + '.thumbs.jpg&group_login=-1';
		// console.log(imgUrl);
		// console.log(path2Save);
		var promise = $cordovaFileTransfer.download(imgUrl, path2Save, {}, true)
													.then(function(result) {
														console.log(result);
														return result;
													}, errorHandler);
		return promise;
	};
	// Download a file, not an image.
	_self.downloadFile = function(path, path2Save) {
		// var fileUrl = _self.getCurrentSrvUrl() + path + '?mode=download&group_login=-1';
		return _self.downloadFileOnSrv(_self.getCurrentSrvUrl(), path, path2Save);
	};
	/* Download the file on the specified server.
	 * @param  srv  must be a server object or a string.
	 */
	_self.downloadFileOnSrv = function(srv, fileRelativeUrl, path2Save) {
		var fileUrl = (angular.isObject(srv) ? srv.url : srv)+fileRelativeUrl+'?mode=download&group_login=-1';
		var promise = $cordovaFileTransfer.download(fileUrl, path2Save, {}, true)
											.then(function(result) {
												return result;
											}, errorHandler, function(progress) {
												return progress;
											});
		return promise;
	}

	// Get media (audio, video) cover art
	_self.getCoverArt = function(file) {
		var q = $q.defer();
		var filePath = file.cachedPath ? file.cachedPath : _self.getFileUrl(file);
		ID3.loadTags(filePath, function() {
			var tags = ID3.getAllTags(filePath);
			if (tags.picture) {
				var image = tags.picture;
        var base64String = "";
        for (var i = 0; i < image.data.length; i++) {
            base64String += String.fromCharCode(image.data[i]);
        }
				file.thumbCache = "data:" + image.format + ";base64," + window.btoa(base64String);
        q.resolve();
      } else {
      	q.reject('No cover art');
      }
    }, {
      tags: ["title","artist","album","picture"]
    });
    return q.promise;
	};

	// -------------------------------------------------------------------------
	// Local DB functions
	// -------------------------------------------------------------------------
	_self.updateFile = function(file) {
		var q = $q.defer();
		// Convert TRUE into 1, FALSE into 0
		angular.forEach(file, function(val, key) {
			if (val === true) {
				file[key] = 1;
			} else if (val === false) {
				file[key] = 0;
			}
		});
		file.acn = $wns.getAcnInfo().acn;
		$db.update('files', $filter('propFilter')(file, TABLE_MODEL.files))
			.then(function(res) {
				q.resolve(res);
			}, function(err) {
				q.reject(err);
			});
		return q.promise;
	};
	_self.deleteFileByAcn = function(acn) {
		var q = $q.defer();
		$db.delete('files', 'acn="'+acn+'"')
			.then(function() {
				q.resolve();
			}, function(err) {
				q.reject('Deleting files about the account '+acn+' ERROR: '+err);
			});
		return q.promise;
	};

	// -------------------------------------------------------------------------
	// Social wall functions
	// -------------------------------------------------------------------------
	var getApiUrl = function(record) {
		// var apiUrl = record.url.split('?')[0].replace('http://', '');
		// apiUrl = apiUrl.substring(apiUrl.indexOf('/'), apiUrl.lastIndexOf('/'));
		return record.srv.url+record.dirPath+'/'+_self.apis.bbs;
	};
	var getSitesInfo = function(sites, srv) {
		var q = $q.defer();
		var list = [];
		async.each(sites, function(site, callback) {
			// Filter out the hidden sources
			if (!site.deny) {
				if (srv) site.cs = srv.cs;
				list.push(site);
				$wns.getServerInfo(site, callback);
			} else {
				callback();
			}
		}, function(err) {
			if (err) {
				q.reject(err);
			} else {
				console.log('Successfully getting all sites info.');
				q.resolve(list);
			}
		});
		return q.promise;
	};
	var tableResult2Array = function(tableResults) {
		var list = [];
		for (var i = 0; i < tableResults.length; i++) {
			list.push(tableResults.item(i));
		}
		return list;
	};
	// Reading the social list from local DB.
	var getLocalSocialList = function(withSite) {
		var q = $q.defer();
		var where = 'type!="0"';
		async.parallel([
			function(callback) {
				$db.query('server', ['*'], where)
					.then(function(results) {
						callback(null, tableResult2Array(results));
					}, function(err) {
						callback('Reading social list from DB ERROR: '+err);
					});
			},
			function(callback) {
				if (withSite) {
					$wns.getCurrentSrv()
						.then(function(srv) {
							$db.query('server', ['*'], 'type="0" AND cs="'+srv.cs+'"')
								.then(function(results) {
									callback(null, tableResult2Array(results));
								})
						}, function(err) {
							callback(err);
						})
				} else {
					callback(null, null);
				}
			}
		], function(err, results) {
			if (err) {
				q.reject(err);
			} else {
				if (results[0]) {
					q.resolve(results[1] ? results[0].concat(results[1]) : results[0]);
				} else {
					q.resolve(results[0] || results[1]);
				}
			}
		});
		return q.promise;
	};
	var getRemoteSocialList = function(withSite) {
		var q = $q.defer();
		if ($cordovaNetwork.isOnline()) {
			$http.get(_self.getCurrentSrvUrl() + _self.apis.usrInfo, 
							{ params: { mode: 'get_site_list', global: 'y' } } )
				.then(function(response) {
					async.parallel([
						function(callback) {
							if (withSite) {
								$wns.getCurrentSrv()
									.then(function(srv) {
										getSitesInfo(response.data.recs, srv)
											.then(function(srvList) {
												callback(null, srvList);
											}, function(err) {
												callback(err);
											});
									}, function(error) {
										callback(error);
									});
							} else {
								callback(null, null);
							}
						},
						function(callback) {
							getSitesInfo(response.data.recs_gm)
								.then(function(srvList) {
									callback(null, srvList);
								}, function(err) {
									callback(err);
								});
						}
					], function(err, results) {
						if (err) {
							q.reject(err);
						} else {
							if (results[0] && results[1]) {
								angular.forEach(results[0], function(srv) {
									var dups = $filter('filter')(results[1], { acn: srv.acn });
									if (dups.length) {
										results[1].splice(results[1].indexOf(dups[0]), 1);
									}
								});
								q.resolve( results[0].concat(results[1]) );
							} else {
								q.resolve(results[0] || results[1]);
							}
						}
					});
					// async.each(response.data.recs_gm, function(src, eachCallback) {
					// 	// Filter out the hidden sources
					// 	if (!src.deny) {
					// 		list.push(src);
					// 		$wns.getServerInfo(src, eachCallback);
					// 	}
					// }, function(err) {
					// 	if (err) {
					// 		errorHandler(err);
					// 	} else {
					// 		console.log('Successfully getting all servers info.');
					// 		q.resolve(list);
					// 	}
					// });
				}, function(error) {
					q.reject(error);
				});	
		} else {
			q.resolve();
		}
		return q.promise;
	};
	var getRecordInfo = function(record) {
		// Updating time from
		record.info = $utils.getTimeFrom($filter('customDate')(record.upload_time))+' - ';
		// Get operation
		record.info += $filter('translate')(record.mode.toUpperCase())+$filter('translate')('_'+record.type.toUpperCase());
	};
	// Parsing the u_fp property of the group to get server url and acn information.
	var getSrvInfo = function(group) {
		var q = $q.defer();
		var info = {};
		// console.log(group);
		info.url = group.u_fp.substr(0, group.u_fp.indexOf('/Site'));
		var groupPath = group.u_fp;
		if (groupPath.indexOf('Site/') < 0) {
			groupPath = group.files[0].url;
		}
		var sitePath = groupPath.substr(groupPath.indexOf('Site/')).replace('Site/', '');
		info.sitePath = sitePath.substr(sitePath.indexOf('/') >= 0 ? sitePath.indexOf('/') : sitePath.length);
		// console.log(sitePath);
		// console.log(sitePath.split('/'));
		// console.log(info);
		info.acn = sitePath.split('/')[0];
		var removedSchemeUrl = info.url.replace('http://', '');
		info.cs = removedSchemeUrl.substr(0, removedSchemeUrl.indexOf('.'));
		$wns.getServerIp(info, info.cs)
			.then(function(response) {
				// console.log(response);
				if (response.status) {
					$wns.checkInternalIp(info)
						.then(function(response) {
							info.url = 'http://'+info.ip+':'+info.port;
							info.site_acn = info.acn+'.'+info.cs; // To set the full info of a server.
							q.resolve(info);
						}, function(err) {
							q.reject(err);
						});
				}
			}, function(err) {
				console.error(err);
				q.reject(err);
			});
		return q.promise;
	};
	// Getting the title of the raw message.
	var getTitle = function(group) {
		var folderHierarchy = group.v_fp.split('/');
		return folderHierarchy.length > 1 ? folderHierarchy[folderHierarchy.length-1]
							: group.v_fp;
	};
	var getAuthorInfo = function(record, cacheDir) {
		var q = $q.defer();
		async.parallel([
			function(callback) {
				// Get author info
				_self.getUserInfo(record.owner)
					.then(function(author) {
						callback(null, author.sun);	// Author's name
					}, function(err) {
						callback('Getting author\'s info ERROR: '+err);
					});
			},
			function(callback) {
				var cachedPath = cacheDir+record.owner+'.thumbs.jpg';
				_self.getFile(cachedPath)
					.then(function(fileEntry) {
						callback(null, cachedPath);
					}, function(err) {
						// File not exists
						_self.getUserHeadImg(record.owner, cachedPath)
							.then(function(fileEntry) {
								//console.log(fileEntry);
								callback(null, cachedPath);	// Author's cover
							}, function(err) {
								callback('Getting the author\'s cover ERROR: '+err);
							});
					})
			}
		], function(err, results) {
			if (err) {
				q.reject(err);
			} else {
				q.resolve({ name: results[0], cover: results[1] });
			}
		});
		return q.promise;
	};
	// Getting the detail info of the record, including the attached files and comments.
	var getRecordDetails = function(msg, record, group, cacheDir) {
		var q = $q.defer();
		record.t_first = group.t_first;
		record.cnt_like = parseInt(record.cnt_like);
		// To avoid the record string invoking the errors.
		record.atc = [];
		record.as = record.srv.acn;
		$wns.getCurrentSrv().
			then(function(currentSrv) {
				async.waterfall([
					function(callback) {
						if (currentSrv.url != record.srv.url) {
							_self.attemptLoginDrive(record.srv.url)
								.then(function(response) {
									callback();
								}, function(err) {
									callback(err);
								});
						} else {
							callback();
						}
					}
				], function(err) {
					switch (record.type) {
						case FILETYPE.bbs:
							// Get the article full info.
							_self.getBBSArticle(record, cacheDir)
								.then(function(response) {
									// Get attached (images).
									getAtcFiles(record, cacheDir);
									// _self.refreshComments(record, cacheDir);
									q.resolve(record);
								}, function(err) {
									q.reject(err);
								});
							// $scope.wallList.push(record);
							break;
						case FILETYPE.html:
							_self.getHTMLArticle(record, cacheDir)
								.then(function(response) {
									// Get attached (images).
									getAtcFiles(record, cacheDir);
									// _self.refreshComments(record, cacheDir);
									// console.log(record);
									q.resolve(record);
								}, function(err) {
									q.reject(err);
								});
							// record.canComment = canComment(record);
							// $scope.wallList.push(record);
							break;
						default:
							// console.log(record);
							if (!msg.id) {
								msg.id = record.id;
								msg.view_path = record.view_path;
							}
							// msg.srvUrl = record.srvUrl;
							if (!angular.isUndefined(record.share_code)) {
								msg.share_code = record.share_code;
							}
							// Setting the owner
							if (!msg.owner) msg.owner = record.owner;
							// Setting the operation.
							if (!msg.mode) msg.mode = record.mode;
							// Setting group type
							if (!msg.type) msg.type = record.type;
							// Setting the upload time of the first record
							if (!msg.upload_time) msg.upload_time = record.upload_time;
							// Processing by type
							switch (record.type) {
								case FILETYPE.img:
									// Get thumbs
									var cachedPath = cacheDir+record.thumbs;
									_self.getFile(cachedPath)
										.then(function(result) {
											// File exists
											// msg.imgs.push(cachedPath);
										}, function(err) {
											var relativePath = record.url.substr(record.url.indexOf('/Site'));
											_self.downloadThumb(relativePath, cachedPath)//, $settings.config.thumb_quality)
												.then(function(response) {
													// console.log('Download file thumb ('+record.url+') successfully.');
												}, function(error) {
													q.reject('Downloading images of the message('+msg.id+') ERROR: '+error);
												});
											// TODO: get comments, use the method the same with HTML
										});
									msg.imgs.push(cachedPath);
									break;
								case FILETYPE.site:
									record.page_name = '';
								case FILETYPE.dir:
									msg.dirs.push({ title: record.title, url: record.page_name, type: FILETYPE.dir, icon: 'ion-folder' });
									break;
								case FILETYPE.audio:
									msg.dirs.push({ title: record.title, url: record.url, type: FILETYPE.audio, icon: 'ion-headphone' });
									break;
								case FILETYPE.doc:
									msg.dirs.push({ title: record.title, url: record.url, type: FILETYPE.doc, icon: 'ion-document' });
									break;
								case FILETYPE.link:
									// console.log(record);
									if (angular.isUndefined(msg.description)) msg.description = '';
									msg.description += '<li><a class="link" href="'+record.link_url+'">'+record.title+'</a></li>';
									break;
								default:

									break;
							}
							// console.log('ParseMsg end');
							// console.log(msg);
							q.resolve(msg);
							break;
					}
				});
			}, function(err) {
				q.reject(err);
			});
		return q.promise;
	};
	// Parsing the attached (images) from the record on the wall and download if updated.
	var getAtcFiles = function(record, cacheDir) {
		if (!record.atc || record.atc == '') return;
		angular.forEach(record.atc, function(atc) {
			// Download the attached file
			// console.log(atc);
			var savePath = '';
			if (atc.tn && atc.tn != '') {
				savePath = cacheDir+atc.tn.substr(atc.tn.lastIndexOf('/')+1);
			} else if (atc.Y == FILETYPE.video) {
				savePath = cacheDir+atc.fp.substr(atc.fp.lastIndexOf('/')+1)+'.thumb.jpg';
				atc.url = record.srv.url+record.dirPath+'/'+atc.fp;
			}
			atc.cachedTn = savePath;
			_self.downloadThumbOnSrv(record.srv.url, record.dirPath+'/'+atc.fp, savePath)
				.then(function(response) {
					// console.log(response);
					if (DEBUG) console.log('Downloaded atc file, '+record.dirPath+'/'+atc.fp+' at '+savePath+' successfully.');
				}, errorOutputHandler);
		});
	};
	// Parsing the record url into the information related to the server, location, and files.
	var parseUrl = function(record) {
		var removedParamsUrl = record.url.split('?')[0];
		var srvPath = removedParamsUrl.substr(removedParamsUrl.indexOf('/Site/'));
		// record.srvUrl = record.url.substring(0, record.url.indexOf('/Site/')); // Domain name.
		record.dirPath = srvPath.substring(0, srvPath.lastIndexOf('/'));
	};
	// To check if has more content than the descriptions.
	var checkReadMore = function(content) {
		if (content) {
			var realContent = content;
			var hasAtag = realContent.indexOf('<a ') >= 0;
			// Parsing the A tag
			if (hasAtag) {
				realContent = realContent.substring(0, realContent.indexOf('<a '))
									+realContent.substring(realContent.indexOf('>')+1, realContent.indexOf('</a>'))
									+realContent.substr(realContent.indexOf('</a>')+4);
			}
			var moreStr = realContent.substr(realContent.length-3);
			var hasMore = (moreStr == '...' || realContent.length >= READMORE_THRESHOLD) ? true : false;
			if (hasMore) {
				if (hasAtag) {
					var startATagIdx = content.indexOf('<a ');
					var startATag = content.substring(startATagIdx, content.indexOf('>')+1);
					// console.log(startATag);
					var aTagInnerLength = content.indexOf('</a>')-content.indexOf('>')-1;
					var aTagInnerHtml = content.substring(content.indexOf('>')+1, content.indexOf('</a>'));
					// console.log(content.substr(content.indexOf('>')+1, aTagInnerLength) );
					// console.log(aTagInnerLength);
					content = realContent.substr(0, READMORE_THRESHOLD)+'...';
					if (content.length < (startATagIdx+aTagInnerLength-1) ) {
						content = startATag+content+'</a>';
					} else {
						content = [content.slice(0, startATagIdx), startATag,
											content.slice( content.indexOf(aTagInnerHtml), aTagInnerLength ), '</a>',
											content.slice( content.indexOf(aTagInnerHtml)+aTagInnerLength )].join('');
					}
					// console.log(content);
				} else {
					content = content.substr(0, READMORE_THRESHOLD)+'...';
				}
			}
			return { hasMore: hasMore, content: content };
		}
		return { hasMore: false, content: content };
	};
	// To check if has priviledges to comment the message.
	var canComment = function(record) {
		return record.type == FILETYPE.bbs ||
					 record.type == FILETYPE.html ||
					 // Now only one image can be commented.
					 ( record.type == FILETYPE.img && (record.imgs.length == 1) && !record.dirs.length );
	};
	/*  Parsing the raw data of the messages from cloud.
	 *  @msgList  raw message list reading from cloud.
	 */
	var parseMsg = function(msgList) {
		var q = $q.defer();
	 	var groups = msgList.recs;
	 	var updateList = [];
		async.eachSeries(groups, function(group, groupCallback) {
			if (group) {
				var msg = { imgs: [], dirs: [], t_first: group.t_first };
				getSrvInfo(group)
					.then(function(srvInfo) {
						// msg.sitePath = srvInfo.sitePath;
						// msg.guestBookAcn = srvInfo.acn;
						// msg.cs = srvInfo.cs;
						msg.srv = srvInfo;
						msg.as = srvInfo.acn;
						msg.title = getTitle(group);
						async.eachSeries(group.files, function(record, eachCallback) {
							var currentSrvAcnDir = $rootScope.storeRoot+srvInfo.cs+'/'+srvInfo.acn+'/';
							// record.guestBookAcn = srvInfo.acn;
							// record.cs = srvInfo.cs;
							record.srv = srvInfo;
							parseUrl(record);
							/* Parallel calls:
							 * 1) Getting author's info.
							 * 2) Getting the details, including attached files and comments.
							 */
							async.parallel([
								function(callback) {
									getAuthorInfo(record, currentSrvAcnDir)
										.then(function(author) {
											// console.log(author);
											msg.author = record.author = author.name;
											msg.authorImg = record.authorImg = author.cover;
											callback(null, record);
										}, function(err) {
											callback(err);
										});
								},
								function(callback) {
									getRecordDetails(msg, record, group, currentSrvAcnDir)
										.then(function(updatedRecord) {
											// console.log(updatedRecord);
											updateList.push(updatedRecord);
											callback(null, record);
										}, function(err) {
											console.error(err);
											callback(err);
										});
								}
							], function(err, results) {
								// console.log(results);
								if (results) {
									if (results[1] && (results[1].type == FILETYPE.html || results[1].type == FILETYPE.bbs) ) {
										// Updating into DB
										_self.updateWall(results[1])
											.then(function() {
												// ++newComming;
												// if (newComming == REFRESH_THRESHOLD) {
												// 	$rootScope.$broadcast('refreshWall');
												// 	newComming = 0;
												// }
											}, errorOutputHandler);
									}
									eachCallback();
								} else {
									eachCallback(err);
								}
							});
							// Convert the properties of numbers
							// record.cnt_like = parseInt(record.cnt_like);
							// if (angular.isUndefined(record.cnt_cmn)) {
							// 	record.cnt_cmn = 0;
							// }
						}, function(err) {
							if (err) {
								groupCallback(err);
							} else {
								if (msg.type) {
									// updateList.push(msg);
									_self.updateWall(msg)
										.then(function() {
											// $rootScope.$broadcast('refreshWall');
											// ++newComming;
											// if (newComming == REFRESH_THRESHOLD) {
											// 	$rootScope.$broadcast('refreshWall');
											// 	newComming = 0;
											// }
										}, errorOutputHandler);	
								}
								groupCallback();
							}
						});
					}, function(error) {
						q.reject(error);
					});
			}
			// console.log($scope.wallList);
		}, function(err) {
			if (err) {
				console.error(err);
			} else {
				// console.log(updateList);
				q.resolve(updateList);
			}
		});
		return q.promise;
	 };

	/* Parallel calls:
	 * 1) Getting the owned list, including website and socials.
	 * 2) Getting the all social list can read.
	 * @withSite   TRUE 	 			  return the server list with both website and related socials
	 * 						 FALSE | NULL   return only the related social list
	 */
	_self.getSocialList = function(withSite) {
		var q = $q.defer();
		async.parallel([
			function(callback) {
				getLocalSocialList(withSite)
					.then(function(socialList) {
						callback(null, socialList);
					}, function(err) {
						callback(err);
					});
			},
			function(callback) {
				getRemoteSocialList(withSite)
					.then(function(socialList) {
						callback(null, socialList);
					}, function(err) {
						callback(err);
					})
			}
		], function(err, results) {
			if (err) {
				q.reject(err);
			} else {
				// console.log(results[0]);
				// console.log(results[1]);
				if (results[1]) {
					var updateList = [];
					angular.forEach(results[1], function(site) {
						var dups = $filter('filter')(results[0], { acn: site.acn, cs: site.cs });
						if (dups.length) {
							var idx = results[0].indexOf(dups[0]);
							results[0].splice(idx, 1);
						}
						updateList.push(site);
					});
					if (results[0] && results[0].length) {
						angular.forEach(results[0], function(srv) {
							if (srv) $wns.delFromDB(srv);
						});
					}
					q.resolve(updateList);
				} else {
					q.resolve(results[0]);
				}
			}
		});
		
		return q.promise;
	};

	/* Setup all publish info to the wall.
	 * @record  record to publish.
	 */
	_self.pubInfo = function(record) {
		if (!angular.isObject(record.srv)) {
			record.srv = angular.fromJson( eval('('+record.srv+')') );
		}
		if (record.dirs && !angular.isArray(record.dirs)) {
			var dirs = angular.fromJson( eval('['+record.dirs+']') );
			// angular.forEach(dirs, function(dir) {
			// 	console.log(dir);
			// 	dir = angular.fromJson( eval('['+dir+']') );
			// });
			record.dirs = dirs;
		} else if (!record.dirs) {
			record.dirs = [];
		}
		if (record.imgs) {
			if (!angular.isArray(record.imgs)) {
				record.imgs = record.imgs.split(',');
			}
		} else {
			record.imgs = [];
		}
		// record.imgs = record.imgs ? record.imgs.split(',') : [];
		if (record.atc && !angular.isArray(record.atc)) {
			record.atc = angular.fromJson( eval('['+record.atc+']') );
		}
		if (record.cachedView && !angular.isObject(record.cachedView)) {
			// console.log(record);
			record.cachedView = angular.fromJson( eval('('+record.cachedView+')') );
		}
		// Updating the record display info
		getRecordInfo(record);
		// To check if read more
		if (record.type == FILETYPE.html || record.type == FILETYPE.bbs) {
			var checked = checkReadMore(record.description);
			record.hasMore = checked.hasMore;
			record.description = checked.content;
			// Getting the comments
			_self.getCommentsLocal(record)
				.then(function(comments) {
					record.comments = comments;
				}, errorOutputHandler);
			// For HTML use
			record.file_path = record.url.substr(record.url.indexOf('/Site/')).replace('/Site/', '');
			// if (record.hasMore) {
			// 	console.log(record.description);
			// 	record.description = record.description.substr(0, READMORE_THRESHOLD)+'...';
			// }
		}
		record.canComment = canComment(record);
		return record;
	};
	/*  Getting the cached messages from DB.
	 *
	 *  @as     site acn for the message source.
	 *  @owner  acn for the owner which the messages to show related to.
	 */
	_self.getWallFromDB = function(as, owner) {
		var q = $q.defer();
		var where = '';
		if (as) {
			where += '`as`="'+as+'"';
			if (owner) {
				where += ' AND `owner`="'+owner+'"';
			}
		} else if (owner) {
			where += 'owner="'+owner+'"';
		}
		$db.query('wall', ['*'], where, 't_first desc')
			.then(function(results) {
				var list = tableResult2Array(results);
				angular.forEach(list, function(record) {
					_self.pubInfo(record);
				});
				q.resolve(list);
			}, function(err) {
				q.reject('Reading messages from DB ERROR: '+err);
			})
		return q.promise;
	};
	_self.getMoreWall = function(time, as, owner) {
		var q = $q.defer();
		_self.getRemoteWall(time, as, owner, false)
			.then(function(moreMsgs) {
				parseMsg(moreMsgs)
					.then(function(appendList) {
						q.resolve(appendList);
					}, function(error) {
						q.reject(error);
					});
			}, function(err) {
				q.reject(err);
			});
		return q.promise;
	};
	/*  Getting the latest messages to show on the wall.
	 *
	 *	@time   the latest time in seconds of the topest message on the wall.
	 *  @as     site acn for the message source.
	 *  @owner  acn for the owner which the messages to show related to.
	 *  @latest TRUE:  getting the latest messages after @time from cloud.
	 *          FALSE: getting the older messages before @time from cloud.
	 */
	_self.getRemoteWall = function(time, as, owner, latest) {
		var q = $q.defer();
		var params = { mode: 'get_global_dynamic2', as: as, ao: owner, ps: INIT_WALL_SIZE };
		if (latest) params.expire = time;
		else params.pt = time;
		$http.get(_self.getCurrentSrvUrl() + _self.apis.usrInfo,
							{ params: params } )
				.then(function(repsonse) {
					q.resolve(repsonse.data);
				}, function(error) {
					q.reject(error);
				});
		return q.promise;
	};
	/*  Getting all cached messages from local DB to show on the wall.
	 *  Waterfall calls:
	 *  1) Reading cached messages from DB to show.
	 *  2) Reading the new messages after the latest message on local from cloud.
	 * 	3) Updating the new messages into local DB.
	 *  Finally, broadcast to refresh the wall.
	 *
	 *  @as     site acn for the message source.
	 *  @owner  acn for the owner which the messages to show related to.
	 */
	 _self.getWall = function(as, owner) {
	 	var q = $q.defer();
	 	async.waterfall([
	 		function(callback) {
	 			_self.getWallFromDB(as, owner)
	 				.then(function(wallList) {
	 					if (wallList && wallList.length) {
	 						callback(null, wallList[0].t_first);
	 					} else {
	 						callback(null, 0);
	 					}
	 					q.resolve(wallList);
	 				}, function(err) {
	 					callback(err);
	 				});
	 		},
	 		function(lastTime, callback) {
	 			_self.getRemoteWall(lastTime, as, owner, true)
	 				.then(function(newMsgList) {
	 					// Parsing messages and updating into DB.
	 					parseMsg(newMsgList)
	 						.then(function() {
	 							callback();
	 						}, function(error) {
	 							callback(error);
	 						});
	 				}, function(err) {
	 					callback(err);
	 				});
	 		}
	 	], function(err, result) {
	 		if (err) {
	 			q.reject(err);
	 		} else {
	 			// console.log('Go refreshWall');
	 			$rootScope.$broadcast('refreshWall');
	 		}
	 	});
	 	return q.promise;
	};
	/*  Getting the friend list.
	 *  @param  acn   according account to get friends.
	 */
	_self.getFriendList = function(acn) {
		var q = $q.defer();
		var params = { mode: 'get_global_dynamic2', act: 'group' };
		$http.get(_self.getCurrentSrvUrl() + _self.apis.usrInfo, { params: params } )
			.then(function(response) {
				var friends = response.data.owner;
				async.eachSeries(friends, function(friend, eachCallback) {
					async.waterfall([
						function(callback) {
							_self.getUserInfo(friend._id)
								.then(function(response) {
									friend.name = response.sun;
									callback(null, friend);
								}, function(error) {
									callback(error);
								});
						},
						function(friend, callback) {
							// console.log(friend);
							$wns.getCurrentSrv()
								.then(function(srv) {
									var cachedPath = $rootScope.storeRoot+srv.cs+'/'+srv.acn+'/'+friend._id+'.thumbs.jpg';
									friend.img = cachedPath;
									_self.getUserHeadImg(friend._id, cachedPath)
										.then(function(fileEntry) {
											if (DEBUG) console.log('Downloaded the friend, '+friend.name+'\'s image successfully.');
										}, function(err) {
											errorOutputHandler('Downloading the friend, '+friend.name+'\'s image ERROR: '+err);
										});
									callback();
								}, function(error) {
									callback(error);
								});
						}
					], function(err) {
						if (err) {
							errorOutputHandler(err);
						} else {
							eachCallback();
						}
					});
				}, function(err) {
					if (err) {
						q.reject(err);
					} else {
						console.log('Got all friends\' info successfully.');
						q.resolve(friends);
					}
				});
			}, function(error) {
				q.reject(error);
			});
		return q.promise;
	};
	// Reading the comments of the record from DB.
	_self.getCommentsLocal = function(record) {
		var q = $q.defer();
		$db.query('comment', ['*'], 'recordId="'+record.id+'"')
			.then(function(results) {
				var comments = tableResult2Array(results);
				angular.forEach(comments, function(comment) {
					comment.idx = parseInt(comment.i);
					comment.timeFrom = $utils.getTimeFrom($filter('customDate')(comment.t));
					if (comment.atc && !angular.isArray(comment.atc)) {
						comment.atc = angular.fromJson( eval('['+comment.atc+']') );
					}
				});
				q.resolve($filter('orderBy')(comments, '-idx'));
			}, function(err) {
				q.reject('Reading comments of record('+record.id+') ERROR: '+err);
			});
		return q.promise;
	};
	// Getting the comment list of the record.
	_self.getComments = function(record) {
		var q = $q.defer();
		var apiUrl = getApiUrl(record);
		var params = $utils.parseParams(record.url);
		params.mode = 'cmn_get'; // Get the comments
		params.p = 1;
		params.ps = 9999;
		delete params.i;
		async.waterfall([
			// Reading from DB.
			function(callback) {
				_self.getCommentsLocal(record)
					.then(function(comments) {
						callback( null, record.comments = comments );
					}, function(err) {
						callback(err);
					});
			},
			// If network is available, refreshing DB from the cloud.
			function(localComments, callback) {
				if ($cordovaNetwork.isOnline()) {
					$http.get( apiUrl, { params: params } )
						.then(function(response) {
							var tmpRecord = angular.copy(record);
							// console.log(response);
							callback(null, tmpRecord.comments = response.data.recs);
							// Refreshing the comments info and updating the DB.
							_self.refreshComments(tmpRecord)
								.then(function(updatedRecord) {
									// console.log('after refreshComments');
									// console.log(updatedRecord.comments);
									// callback(null, updatedRecord.comments);
									_self.checkUpdateComments(localComments, updatedRecord.comments)
										.then(function(updatedList) {
											console.log('updating comments of '+record.id);
											record.comments = updatedList;
										}, function(err) {
											console.error('Checking to update comments of record('+record.id+') ERROR: '+err);
										});
								}, function(err) {
									// callback(err);
									console.error(err);
								});
							// angular.forEach(record.comments, function(comment) {
							// 	comment.idx = parseInt(comment.i);
							// });
							// Re-order by i (time index ?)
							//record.comments = $filter('orderBy')(record.comments, '-idx');
							// q.resolve(record);
						}, function(error) {
							callback('Getting comments of record('+record.id+') ERROR: '+error);
						});
				} else {
					callback(null, localComments);
					// callback(null, null);
				}
			}
		], function(err, result) {
			if (err) {
				q.reject(err);
			} else {
				q.resolve(result);
			}
		});
		return q.promise;
	};
	// Comparing local and remote comment list to update the DB.
	_self.checkUpdateComments = function(localList, newList) {
		var q = $q.defer();
		if (newList) {
			var tempList = angular.copy(localList);
			async.eachSeries(newList, function(comment, callback) {
				var toUpdate = $filter('filter')(tempList, { i: comment.i });
				var errMsg = 'Updating comment into DB ERROR: ';
				if (toUpdate && toUpdate.length) {	// Existing comment
					// Processing, remove it from the list.
					var commentIdx = tempList.indexOf(toUpdate[0]);
					tempList.splice(commentIdx, 1);
				} else {	// New comment
					errMsg = 'Updating DB with new comment ERROR: ';
				}
				// Updating DB.
				_self.updateComment(comment)
					.then(function(res) {
						callback();
					}, function(err) {
						callback(errMsg+err+', comment: '+JSON.stringify(comment));
					});
			}, function(err) {
				if (err) {
					q.reject(err);
				} else {
					if (tempList && tempList.length) {
						async.each(tempList, function(comment, callback) {
							$db.delete('comments', 'recordId="'+comment.recordId+'" AND i="'+comment.i+'"')
								.then(function() {
									callback();
								}, function(err) {
									callback('Delete comment from DB ERROR: '+err);
								});
						}, function(err) {
							if (err) console.error(err);
							else {
								if (DEBUG) console.log('All redundant comments have been deleted.');
							}
						});
					}
					q.resolve(newList);
				}
			});
		} else {
			q.resolve(localList);
		}
		return q.promise;
	};
	// Refreshing the info of comments and then updating into DB.
	_self.refreshComments = function(record) {
		var q = $q.defer();
		if (DEBUG) console.log(record.comments);
		var cacheDir = $rootScope.storeRoot+record.srv.cs+'/'+record.srv.acn+'/';
		// Checking files if exist, then read from local or download remotely
		var acn = record.type == FILETYPE.bbs ? 'acn' : 'user';
		var tm = record.type == FILETYPE.bbs ? 't' : 'tm';
		if (record.comments) {
			async.eachSeries(record.comments, function(comment, eachCallback) {
				var cachedPath = cacheDir+comment[acn]+'.thumbs.jpg';
				comment.recordId = record.id;
				comment.aImg = cachedPath;
				comment.idx = parseInt(comment.i);
				// For HTML only
				if (comment.content) {
					comment.c = comment.content;
				}
				comment.trustedC = $sce.trustAsHtml(comment.c);
				// Getting and setting the time information
				comment.timeFrom = $utils.getTimeFrom($filter('customDate')(comment[tm]));
				async.parallel([
					function(pllcallback) {
						// console.log(comment);
						if (!comment.a) {
							// Get user name
							_self.getUserInfo(comment[acn])
								.then(function(response) {
									// console.log(response);
									comment.a = response.sun;
									pllcallback();
								}, function(err) {
									pllcallback('Getting user info of the comment('+record.id+'.'+comment.i+') encountered ERROR: '+err);
								});
						} else {
							pllcallback();
						}
					},
					function(pllcallback) {
						async.parallel([
							function(pll2callback) {
								_self.getFile(cachedPath)
									.then(function(result) {
										// File exists
										if (DEBUG) console.log('File ('+cachedPath+') exists, using cached file.');
										pll2callback();
									}, function(err) {
										// console.error('File ('+cachedPath+') does not exist ? ');
										// console.error(err);
										// console.log('Getting user head image of '+comment[acn]);
										pll2callback();
										// Get user head image
										_self.getUserHeadImg(comment[acn], cachedPath)
											.then(function(fileEntry) {
												// comment.aImg = cachedPath;
												// console.log(record);
											}, errorOutputHandler);
									});
							},
							function(pll2callback) {
								// Getting attached files (images)
								if (!comment.atc || comment.atc == '') comment.atc = [];
								async.eachSeries(comment.atc, function(atc, atcCallback) {
									// console.log('to set cachedTn in refreshComments');
									// console.log(comment.atc);
									var savePath = '';
									if (atc.tn && atc.tn != '') {
										savePath = cacheDir+atc.tn.substr(atc.tn.lastIndexOf('/')+1);
									} else if (atc.Y == FILETYPE.video) {
										savePath = cacheDir+atc.fp.substr(atc.fp.lastIndexOf('/')+1)+'.thumb.jpg';
										atc.url = record.srv.url+record.dirPath+'/'+atc.fp;
									}
									atc.cachedTn = savePath;
									atcCallback();
									_self.getFile(savePath)
										.then(function(fileResult) {
											// File exists
											if (DEBUG) console.log('Got atc file of the comment('+record.id+'.'+comment.i+') successfully.');
										}, function(error) {
											_self.downloadThumbOnSrv(record.srv.url, record.dirPath+'/'+atc.fp, savePath)
												.then(function(response) {
													// atc.cachedTn = savePath;
												}, errorOutputHandler);
										});
								}, function(err) {
									pll2callback();
									console.log('All comment atc files of record('+record.id+') have been downloaded successfully.')
								});
							}
						], function(err) {
							if (err) {
								pllcallback(err);
							} else {
								pllcallback();
							}
						});
					}
				], function(err) {
					if (err) {
						eachCallback(err);
					} else {
						// console.log('update comments in refreshComments');
						// console.log(comment);
						_self.updateComment(comment);
						eachCallback();
					}
				});
			}, function(err) {
				if (err) {
					q.reject(err);
				} else {
					q.resolve(record);
				}
			});
		} else {
			q.resolve(record);
		}
		
		return q.promise;
	};
	// Get the content of articles from the type BBS.
	_self.getBBSArticle = function(record, cachedDir) {
		var q = $q.defer();
		var apiUrl = getApiUrl(record);
		var params = $utils.parseParams(record.url);
		params.mode = 'rec_get';
		// params.group_login = -1;
		// console.log(record);
		async.waterfall([
			function(callback) {
				$http.get( apiUrl, { params: params } )
					.then(function(response) {
						// console.log(response);
						for (var k in response.data) {
							record[k] = response.data[k];
						}
						// Parsing the 1st link(starts with 'http(s)://') to fetch the cache view and clickable on summary(description).
						getLinkCacheView(record, cachedDir)
							.then(function(updatedRecord) {
								callback(null, record);
							}, function(error) {
								callback(error, record);
							});
						// record.cnt_cmn = parseInt(record.cnt_cmn);
						// callback(null, record);
					}, function(error) {
						callback('Getting the details of BBS article ERROR: '+error);
					});
			},
			function(record, callback) {
				_self.getComments(record)
					.then(function(response) {
						callback(null, response);
					}, function(error) {
						callback(error);
					});
			}
		], function(err, result) {
			if (result) {
				q.resolve(result);
			} else {
				q.reject(err);
			}
		});
		return q.promise;
	};
	// To get the comments of the specified article(HTML).
	_self.getHTMLComments = function(record) {
		var q = $q.defer();
		var apiUrl = record.srv.url+_self.apis.driveHelper;
		var params = { mode: 'file', act: 'GetComment', file_path: record.file_path, p: 1, ps: PAGESIZE };
		async.waterfall([
			// Reading from DB.
			function(callback) {
				_self.getCommentsLocal(record)
					.then(function(comments) {
						callback( null, record.comments = comments );
					}, function(err) {
						callback(err);
					});
			},
			// If network is available, refreshing DB from the cloud.
			function(localComments, callback) {
				if ($cordovaNetwork.isOnline()) {
					$http.get( apiUrl, { params: params } )
							.then(function(response) {
								var tmpRecord = angular.copy(record);
								angular.forEach(response.data, function(val, key) {
									if (key == 'recs') {
										tmpRecord.comments = val;
										// angular.forEach(record.comments, function(comment) {
										// 	comment.idx = parseInt(comment.i);
										// 	comment.c = comment.content;
										// });
									} else {
										record[key] = val;
									}
								});
								callback(null, tmpRecord.comments);

								_self.refreshComments(tmpRecord)
									.then(function(updatedRecord) {
										// console.log(updatedRecord.comments);
										// callback(null, updatedRecord.comments);
										_self.checkUpdateComments(localComments, updatedRecord.comments)
											.then(function(updatedList) {
												console.log('updating comments of '+record.id);
												record.comments = updatedList;
											}, function(err) {
												console.error('Checking to update comments of record('+record.id+') ERROR: '+err);
											});
									}, function(err) {
										console.error(err);
									});
							}, function(error) {
								callback(error);
							});
				} else {
					callback(null, localComments);
				}
			}
		], function(err, result) {
			if (err) {
				q.reject(err);
			} else {
				q.resolve(result);
			}
		});
		return q.promise;
	};
	// Get the content of articles from the type HTML.
	_self.getHTMLArticle = function(record, cachedDir) {
		var q = $q.defer();
		var apiUrl = record.srv.url+_self.apis.driveHelper;
		record.file_path = record.url.substr(record.url.indexOf('/Site/')).replace('/Site/', '');
		// console.log(record);
		var params = { mode: 'file', act: 'GetPageInfo', file_path: record.file_path, get_content: 'y' };
		async.waterfall([
			function(callback) {
				$http.get( apiUrl, { params: params } )
					.then(function(response) {
						// console.log(response);
						record.article = { content: response.data.content,
																title: response.data.rec.title,
																author: response.data.user_sun,
																time: response.data.rec.time };
						record.c = response.data.content;
						callback(null, record);
					}, function(error) {
						q.reject(error);
					});
			},
			function(record, callback) {
				_self.getHTMLComments(record)
						.then(function(response) {
							callback(null, response);
						}, function(error) {
							q.reject(error);
						});
			}
		], function(err, result) {
			q.resolve(result);
		});
		return q.promise;
	};
	_self.setLike = function(record) {
		var q = $q.defer();
		var apiUrl, params;
		switch (record.type) {
			case FILETYPE.bbs:
				apiUrl = getApiUrl(record);
				params = $utils.parseParams(record.url);
				params.mode = 'like';
				params.like = record.bMyLike ? 'y' : 'n';
				// console.log(params);	
				$http.get( apiUrl, { params: params } )
						.then(function(response) {
							q.resolve(response.data);
						}, function(error) {
							q.reject(error);
						});
				break;
			case FILETYPE.html:
				apiUrl = record.srv.url+_self.apis.driveHelper;
				params = { mode: 'file', act: 'ClickLike', file_path: record.file_path, like: record.bMyLike ? 'y' : 'n' };
				$http.get( apiUrl, { params: params } )
						.then(function(response) {
							q.resolve(response.data);
						}, function(error) {
							q.reject(error);
						});
				break;
		}
		return q.promise;
	};
	_self.postFile2GetAtc = function(record, files) {
		var q = $q.defer();
		var path = $utils.parseParams(record.url).path
		var params = { mode: 'uaf_up_qq', path: path+'/' };

		if (files && files.length) {
			var atcs = '', numComplete = 0;

			// angular.forEach(files, function(file) {
			async.whilst(
				function() { return numComplete < files.length; },
				function(callback) {
					$cordovaFileTransfer.upload( getApiUrl(record), files[numComplete].cachedTn, { params: params }, true)
								.then(function(response) {
									var atcInfo = eval('('+response.response+')');
									atcs += $utils.atcInfo2Str(atcInfo);
									numComplete++;
									$timeout(callback);
								}, function(error) {
									q.reject(error);
								}, function(progress) {
									q.notify(progress);
								});
				},
				function(error) {
					q.resolve(atcs);
				}
			);
			// });
		} else {
			q.resolve(true);
		}
		
		/*var fData = new FormData();
		fData.append('mode', 	'uaf_up_qq');
		fData.append('path', record.dirPath);
		fData.append('file');
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {            
			q.resolve(xhr);
		};
		xhr.upload.addEventListener("progress", function(event) {
			if (event.lengthComputable) {
				var progress = event;
				q.notify(progress);
			}
		}, false);
		xhr.open('POST', record.srv.url + _self.apis.bbs);
		//xhr.setRequestHeader("Cache-Control", "no-cache");
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.send(fData);
		q.resolve(true);*/
		return q.promise;
	};
	// Create/Edit message(record).
	_self.sendMsg = function(record, isCreate) {
		var q = $q.defer();
		var apiUrl = getApiUrl(record);
		var params = $utils.parseParams(record.url);
		params.mode = 'ea_up';
		params.c_type = 'text';
		if (isCreate) {
			params.mode = 'ca_up';
			params.tag = 'message';
		}
		if (record.atcStr) {
			params.atc = record.atcStr;
		}
		$http.post(apiUrl, params)
				.then(function(response) {
					q.resolve(response);
				}, function(error) {
					q.reject(error);
				});
		return q.promise;
	};
	_self.sendComment = function(record, comment, isCreate) {
		var apiUrl, params;
		var q = $q.defer();

		switch (record.type) {
			case FILETYPE.bbs:
				apiUrl = getApiUrl(record);
				params = $utils.parseParams(record.url);
				params.mode = isCreate ? 'far_up' : 'ea_up';
				params.FA_Content = comment.c;
				params.c_type = 'text';
				params.i = comment.i;
				if (comment.atcStr) {
					params.atc = comment.atcStr;
				}
				// console.log(params);

				$http.post(apiUrl, params)
					.then(function(response) {
						// console.log(response);
						if (response.statusText == 'OK') {
							_self.getComments(record)
								.then(function(response) {
									// record.cnt_cmn = response.comments.length;
									q.resolve(response);
								}, function(error) {
									q.reject(error);
								});
						}
					}, function(error) {
						q.reject(error);
					});
				break;
			case FILETYPE.html:
				apiUrl = record.srv.url + _self.apis.driveHelper;
				params = { mode: 'file', file_path: record.file_path, content: comment.c };
				// console.log(comment);
				if (isCreate) {
					params.act = 'AddComment';
				} else {
					params.act = 'UpdComment';
					params.id = comment.i;
				}
				$http.post(apiUrl, params)
						.then(function(response) {
							// console.log(response);
							if (response.data == 'ok' || response.data.succeed == 'ok') {
								_self.getHTMLComments(record)
									.then(function(response) {
										q.resolve(response);
									}, function(error) {
										q.reject(error);
									});
							}
						}, function(error) {
							q.reject(error);
						});
				break;
		}
		return q.promise;
	};
	_self.delRecord = function(record, idx) {
		var q = $q.defer();
		var apiUrl, params;
		switch (record.type) {
			case FILETYPE.bbs:
				apiUrl = getApiUrl(record);
				params = $utils.parseParams(record.url);
				params.mode = 'da_up';
				params.i = idx;
				$http.get( apiUrl, { params: params } )
					.then(function(response) {
						q.resolve(response);
					}, function(error) {
						q.reject(error);
					});
				break;
			case FILETYPE.html:
				apiUrl = record.srv.url + _self.apis.driveHelper;
				params = { mode: 'file', act: 'DelComment', file_path: record.file_path, id: idx };
				$http.get( apiUrl, { params: params } )
						.then(function(response) {
							q.resolve(response);
						}, function(error) {
							q.reject(error);
						});
				break;
		}
		return q.promise;
	};
	// Updating record into DB.
	_self.updateWall = function(record) {
		var q = $q.defer();
		// Convert properties of object into string
		var record2DB = $filter('propFilter')(record, TABLE_MODEL.wall);
		record2DB = $utils.obj2Str(record2DB);
		$db.update('wall', record2DB)
			.then(function(res) {
				if (DEBUG) console.log('Update record ('+record.id+') into wall DB successfully');
				q.resolve();
			}, function(err) {
				q.reject('Updating record ('+record.id+') into wall DB ERROR: '+err);
			});
		return q.promise;
	};
	// Updating comment into DB.
	_self.updateComment = function(comment) {
		var q = $q.defer();
		if (comment.tm) {
			comment.t = comment.tm;
		}
		if (comment.user) {
			comment.acn = comment.user;
		}
		var comment2DB = $filter('propFilter')(comment, TABLE_MODEL.comment);
		comment2DB = $utils.obj2Str(comment2DB);
		$db.update('comment', comment2DB)
			.then(function(res) {
				if (DEBUG) console.log('Updated comment ('+comment.i+') into DB successfully.');
				q.resolve();
			}, function(err) {
				q.reject('Updating comment ('+comment.i+') into DB ERROR: '+err);
			})
		return q.promise;
	};

	// -------------------------------------------------------------------------
	// Edit: create, rename, move, copy, delete
	_self.edit = function(method, path, options) {
		var promise;
		var apiUrl = _self.getCurrentSrvUrl() + _self.apis.edit;
		switch (method) {
			case 'createDir':
				options.mode = 'create_dir';
				options.code = 'nuweb_editpass';
				options.path = path;
				break;
			case 'rename':
				options.mode = 'rename';
				options.site = 'Site';
				options.code = 'nuweb_editpass';
				options.path = path;
				break;
		}
		promise = $http.get( apiUrl, { params: options } )
						.then(function(response) {
							return response;
						});
		return promise;
	};

	// Delete file or folder
	_self.delete = function(path) {
		var apiUrl = _self.getCurrentSrvUrl() + _self.apis.delete;
		var promise = $http.get( apiUrl, { params: { mode: 'set_trash', page_url: path } })
										.then(function(response) {
											return response.data.recs;
										}, errorHandler);
		return promise;
	};

	// Clear cache file: delete the file on the local file system
	_self.clearCache = function(file) {
		var q = $q.defer();

		var onSuccess = function(fileEntry) {
			fileEntry.remove(function() {
				// Successfully deleted the cached file, then updating the db record.
				file.cachedPath = null;
				_self.updateFile(file)
					.then(function(res) {
						q.resolve();
					}, q.reject);
			}, q.reject);
		};
		var onError = function(error) {
			console.error(error);
		};
		try {
      $window.resolveLocalFileSystemURL(file.cachedPath, onSuccess, onError); 
    } catch (err) {
      q.reject(err);
    }
    return q.promise;
	};
	_self.deleteThumb = function(file) {
		var q = $q.defer();

		var onSuccess = function(fileEntry) {
			fileEntry.remove(function() {
				// Successfully deleted the cached file, then updating the db record.
				file.thumbCache = null;
				q.resolve();
			}, q.reject);
		};
		var onError = function(error) {
			console.error(error);
		};
		try {
      $window.resolveLocalFileSystemURL(file.thumbCache, onSuccess, onError); 
    } catch (err) {
      q.reject(err);
    }
    return q.promise;
	}

	// Get file entry on the local file system
	_self.getFile = function(path) {
		var q = $q.defer();

		var onSuccess = function(fileEntry) {
			if (fileEntry.isFile) {
				fileEntry.file(function(fileObj) {
					var nativeUrl = fileEntry.nativeURL;
					fileObj.filename = nativeUrl.substr(nativeUrl.lastIndexOf('/')+1);
					q.resolve(fileObj);
				});
			} else {
				q.resolve(null);
			}
		};
		var onError = function(error) {
			q.reject('Get file error: '+error);
		};
		try {
      $window.resolveLocalFileSystemURL(path, onSuccess, onError); 
    } catch (err) {
      q.reject(err);
    }

		return q.promise;
	};

	// Recursively deleting the folder.
	_self.deleteFolder = function(path) {
		var q = $q.defer();

		var onSuccess = function(dirEntry) {
			if (dirEntry.isDirectory) {
				dirEntry.removeRecursively(function() {
					console.log('Deleted folder '+path+' successfully.');
					q.resolve();
				}, onError);
			} else {
				console.error('Not a folder, error deleteing.');
				q.resolve();
			}
		};
		var onError = function(error) {
			q.reject('Deleting folder '+path+' ERROR: '+error);
		};
		try {
      $window.resolveLocalFileSystemURL(path, onSuccess, onError); 
    } catch (err) {
      q.reject(err);
    }

		return q.promise;
	};

	return _self;
};