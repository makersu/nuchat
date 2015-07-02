angular.module('chatbox.services', ['lbServices', 'btford.socket-io'])
	.factory('signaling', function (socketFactory, ENV) {
        console.log('signaling')
        var url='http://140.123.4.17:3001/';
        // var url='http://54.92.67.230:3000/';//aws
        // var url=ENV.BASE_URL
        console.log('signaling '+url)

        // var socket = io.connect(url);
        var socket = io(url, {
          transports: [ 'websocket' ]
        });
        
        var socketFactory = socketFactory({
          ioSocket: socket
        });

        return socketFactory;
	})
	.factory('FriendService', FriendService)
	.factory('LBSocket', LBSocket)
	.factory('$ChatboxTags', TagService)
	.factory('$utils', UtilService)
	.factory('RoomService', RoomService);