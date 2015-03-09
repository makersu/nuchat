function LBSocket($rootScope) {
  // var baseUrl = 'http://54.92.67.230:3333/';
  // var baseUrl = 'http://10.0.0.115:3333/api';
  var baseUrl = 'http://localhost:3333/';
  // For Android Development using genymotion.
  // var baseUrl = 'http://192.168.56.1:3333/';
  var socket = io.connect(baseUrl);
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
