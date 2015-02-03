function FriendCtrl($scope, FriendService, User, LBSocket){
	console.log('FriendCtrl');

	$scope.friends = FriendService.getAll();
  console.log($scope.friends)



  User.find({})
  .$promise
  .then(
  function (res) {
  	console.log(res)
      //$scope.tweet = res[0];
      /**
       * Find avatar from the user
       */
      
  },
  function (err) {
  	console.log(err)
  });

	

}