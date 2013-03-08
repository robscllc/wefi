Meteor.startup(function() {

  var require = __meteor_bootstrap__.require;
  var path = require('path');
  var fs = require('fs');
  var base = path.resolve('.');
  var isProd = fs.existsSync(base + '/static');

  WeFi.md_converter = require(base + (isProd ? "/static" : "/public") + "/thirdparty/pagedown/Markdown.Sanitizer").getSanitizingConverter();
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
