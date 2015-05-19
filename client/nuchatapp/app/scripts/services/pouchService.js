function PouchService($q) {
	console.log('PouchService')
  // $scope.listOfStuff = [];

  // $scope.db = new PouchDB('my_database');

  // $scope.db.allDocs({include_docs: true}).then(function (result) {
  //   var docs = result.rows.map(function (row) { return row.doc; });

  //   $scope.listOfStuff = docs;

  //   $rootScope.$apply(); // <--- better call this!

  // }).catch(function (error) {
  //   // got an error somehow
  // });
	
  var db = new PouchDB('chatbox', {adapter: 'websql'}); // <--- this one uses the SQLite plugin
  console.log(db.adapter);
  // db.destroy();


  var getFriends = function(cb){
		console.log('PouchService getFriends');

		var deferred = $q.defer();
		
		db.query(
			function(doc, emit) {
			  if ( doc.docType === 'friend' ) {
				  emit(doc);
				}
			},
			function(err, result) {
			  if (err) {
					deferred.reject(err);
				}
				deferred.resolve(result.rows);
		});//end db.query

		return deferred.promise;

	};

	var saveFriend = function(doc){
		console.log('PouchService saveFriend');
		// console.log(doc);
		doc.docType='friend';

		var deferred = $q.defer();
		
		upsert(doc, function(err,result){
			if(err){
				deferred.reject(err);
			}
			deferred.resolve(doc);
		});

		return deferred.promise;

  };



 //  var getRooms = function(cb){
	// 	console.log('PouchService getRooms');
	// 	db.query(
	// 		function(doc, emit) {
	// 		  if ( doc.docType === 'room' ) {
	// 			  emit(doc);
	// 			}
	// 		},
	// 		function(err, result) {
	// 		  if (err) {
	// 				console.log(err);
	// 				cb(err); 
	// 			}
	// 			console.log(result);
	// 			cb(null,result.rows);
	// 	});//end db.query

	// };

	var getRooms = function(cb){
		console.log('PouchService getRooms');

		var deferred = $q.defer();
		
		db.query(
			function(doc, emit) {
			  if ( doc.docType === 'room' ) {
				  emit(doc);
				}
			},
			function(err, result) {
			  if (err) {
					deferred.reject(err);
				}
				deferred.resolve(result.rows);
		});//end db.query

		return deferred.promise;

	};

	// var addRoom = function(item,cb){
	// 	console.log('PouchService addRoom');

	// 	item.type='room';
	// 	upsert(item,cb);
 //  };

	var saveRoom = function(item){
		console.log('PouchService saveRoom');
		console.log(item);
		item.docType='room';

		var deferred = $q.defer();
		
		upsert(item, function(err,result){
			if(err){
				deferred.reject(err);
			}
			deferred.resolve(item);
		});

		return deferred.promise;

  };

 //  var getFriends = function (){

 //  	db.query(function(doc, emit) {
	// 	  if ( doc.docType === 'friend' ) {
	// 		    emit(doc);
	// 		}
	// 	}, function(err, results) {
	// 	  if (err) { return console.log(err); }
	// 	  console.log('getFriends');
	// 	  console.log(results);
	// 	  // handle result
	// 	});
	// };

  var addFriend = function(item){
		console.log('PouchService addFriend');
		item.docType='friend';
		upsert(item);
  };

  var upsert = function(item,cb){
  	console.log('PouchService upsert');
  	// console.log(item);
  	item._id=item.id;

		db.get(item.id, function(err, doc) {
		  if (err) {
				console.log(err);
				cb(err);
				//create
				db.put(item,function(err, resp){
					if(err){
						console.log(err);
						cb(err);
					}
					else{
						console.log('create doc');
						cb(null,resp);
					}
				});
		  }
		  else{ //update
				// console.log(doc);
				item._rev = doc._rev;
				db.put(item,function(err, resp){
					if(err){
						console.log(err);
						cb(err);
					}
					else{
						console.log('update doc');
						cb(null,resp);
					}
				});
		  }
		  
		});


  };
  
  var service = {
  	getFriends: getFriends,
  	saveFriend: saveFriend,
  	getRooms: getRooms,
  	saveRoom: saveRoom,
		addFriend: addFriend,
  };

  return service;

}