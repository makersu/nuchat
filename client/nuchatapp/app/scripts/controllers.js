'use strict';
angular.module('Nuchatapp.controllers', [])
.controller('LoginCtrl', LoginCtrl)
.controller('RegisterCtrl', RegisterCtrl)
.controller('AccountCtrl', AccountCtrl)
.controller('RoomCtrl', RoomCtrl)
.controller('ChatCtrl', ChatCtrl)
.controller('FriendCtrl', FriendCtrl)
.controller('DirectoryCtrl', DirectoryCtrl)
.controller('DirArticleCtrl', DirArticleCtrl)
.controller('DirFilesCtrl', DirFilesCtrl)
.controller('DirLinksCtrl', DirLinksCtrl)
.controller('DirCalendarCtrl', DirCalendarCtrl)
.controller('VideoCallCtrl', VideoCallCtrl)
.controller('CalCtrl', function($scope, $localstorage, $state, $window, $rootScope) {

  var _events = [
		{
	    title: '專案例會',
	    location: 'The Moon',
	    notes: '上週工作報告',
	    startDate: new Date(2015, 0, 6, 9, 30, 0, 0, 0),
	    endDate: new Date(2015, 1, 6, 12, 0, 0, 0, 0),
      type: 'assertive'
	  },
	  {
	    title: 'Birthday Party',
	    location: 'The Moon',
	    notes: 'Bring Wine',
	    startDate: new Date(2015, 0, 6, 20, 0, 0, 0, 0),
	    endDate: new Date(2015, 1, 6, 22, 0, 0, 0, 0),
      type: 'balanced'
	  }

	];

  $scope.selectedDay = moment();

  $scope.displayEvents = _events;

  $scope.changeDate = function( el, cont, dateProp ) {
    // console.log(cont);
    localStorage.setItem('date-id', JSON.stringify(cont));
    // $scope.displayEvents = $filter('filter')(_events, {startDate: cont});
    return false;
  }

  $scope.now = moment();
  var _refreshViewData = function () {
      $scope.dia = $localstorage.getObject('date-id');
    }
  _refreshViewData();
  $scope.refresh = function () {
      _refreshViewData();
  }
  $scope.reload = function(){
    {
        $rootScope.$broadcast('rangeCalendar');
        _refreshViewData();
    };

    //$state.go($state.$current, null, { reload: true });
    //localStorage.setItem('date-id', JSON.stringify(moment()));
    //$window.location.reload(true);
    //$scope.now = moment();
  }

});