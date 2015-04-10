var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

//var bodyParser = require('body-parser');

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname);

// to support JSON-encoded bodies
//app.use(bodyParser.json());

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  //app.start();
  //var server = app.start();
  //app.sio = require('socket.io')(server);
  app.sio = require('socket.io')(app.start());
  var redis = require('socket.io-redis');
  app.sio.adapter(redis({ host: 'localhost', port: 6379 }));

}
