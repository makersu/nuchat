function LBSocket($rootScope, ENV, User) {

  console.log('websocket '+ENV.BASE_URL);
 
  //var socket = io.connect(ENV.BASE_URL);
  var socket = io(ENV.BASE_URL, {
    transports: [ 'websocket' ]
  });

  //when get new room
  socket.on('connection', function(data) {
    console.log('connection');
    console.log(data);
    if(User.getCachedCurrent()){
      socket.emit('self:join', User.getCachedCurrent().id);
    }

  });//rooms:new

  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
}
