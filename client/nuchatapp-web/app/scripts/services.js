angular.module('starter.services', ['chatbox.services'])

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: "551525c2586ad2a7489b8a3d",
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png',
    roomId: '555ad3e269a4eb48506f417f',
  }, {
    id: "551118a3add1f96c4525cc4b",
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460',
    roomId: '555ad4f869a4eb48506f4180',
  },{
    id: "551131dfcdca2f33495446d7",
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg',
    roomId: '556d413487569246505788c9',
  }, {
    id: "552b5aa89d6690c873f03176",
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png',
    roomId: '55754fce38a7ca013b0b8c25',
  }, {
    id: "55348ace5a5fc7f843e84643",
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png',
    roomId: '557976aee06199cd131d88c9',
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
});
