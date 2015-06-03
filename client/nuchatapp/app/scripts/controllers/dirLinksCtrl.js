function DirLinksCtrl($scope, $rootScope, $NUChatLinks, $NUChatTags, $scrolls, $filter, RoomService, User, $juiUtility, METATYPE, $ionicScrollDelegate) {
	/* Variables */
	// Private

	// Scope public

	/* Methods */
	// Private
	var getOrderedLinks = function() {
		// console.log($scope.room.messages);
		// console.log($filter('orderBy')($NUChatLinks.getLinks($scope.room.messages), '-created'));
		var list = $filter('orderBy')($NUChatLinks.getLinks($scope.room.messages), '-created');
		angular.forEach(list, function(link) {
			if (!link.linkView) {
				link.text && $juiUtility.getSummaryLink(link.text, {id: link.id})
					.then(function(result) {
						link.linkView = result;
					}, function(err) {
						console.error(err);
					});
			}
		});
		return list;
	}
	// Scope public
	$scope.editTags = function(link) {
		$rootScope.editTags(link, true);
		link.isFlipped = false;
	}
	$scope.delLink = function(link) {
		// link.isFlipped = false;
		$NUChatLinks.remove(link.id);
		$scope.linkList = getOrderedLinks();
	};
	$scope.addLink = function(isEdit) {
		$scope.toEditLink($scope, isEdit)
			.then(function(result) {
				RoomService.createMessage({ type: METATYPE.LINK, roomId: $scope.room.id, ownerId: User.getCachedCurrent().id, text: result });
			});
	};
	$scope.shareLink = function(link) {
		// console.log(link);
		window.plugins.socialsharing.share(link.linkView.url);
	};

	/* Onload */
	// Events
	$scope.$on('$ionicView.loaded', function() {
		// console.log('link view loaded');
	});
	$scope.$on('$ionicView.enter', function() {
		// console.log('enter link view');
		$NUChatTags.setItemList($scope.linkList = getOrderedLinks());
		// console.log($scope.linkList);
		$scrolls.setContentContainer('.directory .view-container[nav-view="active"] .scroll-content');
		$scrolls.resize();
		// Rebind the global functions
		$rootScope.addDir = $scope.addLink;
	});
	$scope.$on('onTagFiltered', function() {
		$scope.linkList = $NUChatTags.getFilteredList();
	});
	$scope.$on('onNewMessage', function(event, args) {
		console.log('onNewMessage');
		// To compile the linkView.
		if (args.msg.type === METATYPE.LINK) {
			$juiUtility.getSummaryLink(args.msg.text, {id: args.msg.id})
				.then(function(result) {
					args.msg.linkView = result;
					$scope.room.messages[args.msg.id] = args.msg;
					$NUChatTags.setItemList($scope.linkList = getOrderedLinks());
					// console.log($scope.linkList);
					$ionicScrollDelegate.scrollTop();
				}, function(err) {
					console.error(err);
				});
		}
	});
}