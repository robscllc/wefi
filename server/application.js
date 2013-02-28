Meteor.startup(function() {

  var require = __meteor_bootstrap__.require;
  var path = require('path');
  var fs = require('fs');
  var base = path.resolve('.');
  var isProd = fs.existsSync(base + '/static');

  WeFi.md_converter = require(base + (isProd ? "/static" : "/public") + "/thirdparty/pagedown/Markdown.Sanitizer").getSanitizingConverter();

  ActiveUsers.remove({});
  Meteor.default_server.stream_server.register( Meteor.bindEnvironment( function(socket) {
    var intervalID = Meteor.setInterval(function() {
      if (socket.meteor_session && socket.meteor_session.userId && ! ActiveUsers.findOne({ userId: socket.meteor_session.userId})) {
	
        var connection = {
          connectionId: socket.meteor_session.id,
          userId: socket.meteor_session.userId
        };
	
        socket.id = socket.meteor_session.id;
        ActiveUsers.insert(connection); 
      }
    }, WeFi.active_users_poll_interval);
    
    socket.on('close', Meteor.bindEnvironment(function () {
      ActiveUsers.remove({
        connectionId: socket.id
      });
    }, function(e) {
      Meteor._debug("Exception from connection close callback:", e);
    }));

  }, function(e) {
    Meteor._debug("Exception from connection registration callback:", e);
  }));

});
