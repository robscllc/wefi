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

Meteor.Router.add('/tag/:tag.xml', function(tag) {
  var tags = (_.isString(tag) ? tag.split('-') : []);

  var url = this.request.url.substr(1);
  var title = "Weekday Filler: posts tagged with " + _.map(tags, function(s) { return "'" + s + "'"; }).join(' and ');

  var feed = new RSS({
    title: title,
    description: title,
    feed_url: Meteor.absoluteUrl(url),
    site_url: Meteor.absoluteUrl()
  });

  var cons = { parent: null };
  
  if (tags.length > 1) {
    cons['$and'] = _.map(tags, function(tag){ return { tags: tag } });
  } else {
    cons.tags = tags[0];
  }
   
  Posts.find(cons, {sort: {posted: -1}, limit: 20}).
    forEach(function(post) {
      feed.item({
	title: post.title,
	description: post.body_rendered,
	author: WeFi.displayName(post.owner),
	date: post.posted,
	url: WeFi.getPostUrl(post),
	guid: post._id
      });
    });
  
  return feed.xml();
});
