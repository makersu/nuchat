function FriendCtrl($scope, $state, $ionicHistory, $location, $ionicModal, User, LBSocket, FriendService, RoomService, $filter, $timeout, $ionicTabsDelegate, $animate){
	console.log('FriendCtrl');
  /* Variables */
  $scope.modalTitle = $filter('translate')('NEW_FRIENDS');
	$scope.friends = [];

  /* Methods */
  // Private
  function slideinTabs() {
    var tabs = null;
    var tabHandles = $filter('filter')($ionicTabsDelegate._instances, { $$delegateHandle: 'chatDelegate' });
    if (tabHandles.length) {
      tabs = tabHandles[0].$tabsElement;
      if (tabs) {
        // Re-add tabs.
        $animate.removeClass(tabs, 'slideout');
      }
    }
  }

  $scope.friendAction = function(friendId) {
    $scope.selected = FriendService.get(friendId);
    if (!$scope.friendModal) {
      $ionicModal.fromTemplateUrl('friendModal.html', {
        scope: $scope,
      }).then(function(modal) {
        $scope.friendModal = modal;
        $scope.friendModal.show();
      });
    } else {
      $scope.friendModal.show();
    }
  };
  $scope.closeFriendModal = function() {
    $scope.friendModal.hide();
  };

	$scope.friendChat = function(friendId){
		console.log(friendId);//

		var privateroom={
  		user: User.getCachedCurrent().id,
  		friend: friendId
  	}

  	LBSocket.emit('friend:join', privateroom, function(room) {
      console.log('friend:join callback')
  		console.log(room)
      if(room.id){
        console.log($ionicHistory.backView())
        console.log($ionicHistory.currentView())
      	//$ionicHistory.currentView($ionicHistory.backView());
        $scope.friendModal.isShown() && $scope.closeFriendModal();
      	$state.go('tab.chatRoom',{roomId:room.id},{location: 'replace'});	
        // $location.path('/tab/room/'+room.id);
      }
		});

	}

  $scope.friendVideoCall = function(friend){
    console.log(friend);//
    $scope.friendModal.isShown() && $scope.closeFriendModal();
    console.log('closeModal');
    $state.go('videocall',{ isCalling: true, contactTarget: angular.toJson(friend) },{location: 'replace'}); 
  }

  $scope.doRefresh = function() {
    console.log('doRefresh')
    FriendService.getFriends();
    $scope.$broadcast('scroll.refreshComplete');
    $scope.$apply()
  };

  $ionicModal.fromTemplateUrl('templates/modals/searchFriendModal.html', function(modal) {
    $scope.searchFriendModal = modal;
    }, {
      scope: $scope
  });

  $scope.showSearchFriendModal = function(){
    $scope.searchFriendModal.show();
  }

  $scope.hideSearchFriendModal = function(){
    $scope.searchFriendModal.hide();
  }

  $scope.search={}
  //Refactoring
  $scope.searchFriend = function(){
    console.log($scope.search);
    if(!$scope.search.text){
      console.log('!$scope.search.text')
      return;
    }
    var data={}
    data.searchText=$scope.search.text
    data.userId=User.getCachedCurrent().id
    console.log(data)
    console.log('friends:find')
    LBSocket.emit('friends:find',data,function(err,results){
      if(err){
        console.log(err)
      }
      else{
        console.log(results)
        $scope.results=results;
      }
    });
  }

  $scope.addNewFriends = function(results){
    console.log('addFriend')
    console.log(results)
    if(!results){
      $scope.hideSearchFriendModal()
      return;
    }
    var data={}
    data.newFriends=[]

    for(var i=0;i<results.length;i++){
      if(results[i].selected){
        console.log(results[i])
        data.newFriends.push(results[i].id)//
      }
    }

    data.userId=User.getCachedCurrent().id
    //console.log(data)
    FriendService.addNewFriends(data)
      .then(function(friends) {
        $scope.friends = friends;
      });
    $scope.hideSearchFriendModal()
  }

  /* OnLoad */
  // OnResume
  $scope.$on('$ionicView.enter', function() {
    slideinTabs();
    FriendService.getFriends()
      .then(function(friends) {
        $scope.friends = friends;
      });
  });

}