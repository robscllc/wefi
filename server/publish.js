var md_converter;

Meteor.publish('currentUser', function() {
  return Meteor.users.find(this.userId);
});

Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1, profile: 1, username: 1}});
});

Meteor.publish("posts", function () {
  if (this.userId && isAdminById(this.userId)) {
    return Posts.find();
  } else {
    return Posts.find({ $or: [{state: "active"}, { state: "closed"}]});
  }
});

Meteor.startup(function() {

  var require = __meteor_bootstrap__.require;
  var path = require('path');
  var base = path.resolve('.');
  md_converter = require(base + "/client/thirdparty/pagedown/Markdown.Sanitizer").getSanitizingConverter();

  Posts.allow({
    insert: function (userId, post) {
      return false; // no cowboy inserts -- use createPost method
    },
    update: function (userId, posts, fields, modifier) {
      return _.all(posts, function (post) {
	console.log(fields);
	if (userId !== post.owner)
          return false; // not the owner
	
	var allowed = ["body", "tags"];
	if (_.difference(fields, allowed).length)
          return false; // tried to write to forbidden field
	
	// A good improvement would be to validate the type of the new
	// value of the field (and if a string, the length.) In the
	// future Meteor will have a schema system to makes that easier.
	return true;
      });
    },
    remove: function (userId, posts) {
      return isAdminById(userId);
      return ! _.any(posts, function (post) {
	return isAdminById(userId);
      });
    }
  });
});

Meteor.methods({
  // options should include: title, description, x, y, public
  createPost: function (options) {
    options = options || {};
    if (! (typeof options.body === "string" &&
           options.body.length ))
      throw new Meteor.Error(400, "Required parameter missing");
    if (options.body.length > 1000)
      throw new Meteor.Error(413, "Body too long");
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");

    var par;
    if (options.parent)
      par = Posts.findOne(options.parent);

    if (par && par.state == 'closed')
      throw new Meteor.Error(403, "Parent post is closed");

    var now = new Date();
    var post = Posts.insert({
      owner: this.userId,
      body: options.body,
      body_rendered: md_converter.makeHtml(options.body),
      posted: now,
      state: 'active',
      parent: options.parent,
      slug: null,
      full_slug: null,
      tags: options.tags,
      votes: []
    });

    var root = post;
    var depth = 0;
    var slug = Math.floor(Math.random()*1679616).toString(36);
    var full_slug = now.toJSON().replace(/[\D]/g, '') + ':' + slug;
    if (par) {
      root = par.root;
      depth = par.depth + 1;
      slug = [par.slug, slug].join('/')
      full_slug = [par.full_slug, full_slug].join('/')
    }

    Posts.update(post, { $set: { 'root': root, 'depth': depth, 
				 'slug': slug, 'full_slug': full_slug } });
    return post;
  },
  setPostState: function(options) {
    options = options || {};
    if (! (this.userId && isAdminById(this.userId) ) )
      throw new Meteor.Error(403, "You must be admin to change state");
    if (! _.contains(['active', 'closed', 'hidden'], options.state))
      throw new Meteor.Error(400, "Invalid state");

    var post = Posts.findOne(options.post_id);
    if (! post)
      throw new Meteor.Error(404, "No such post");

    Posts.update({ root: post.root, slug: {$regex: post.slug }},
		 { $set: { state: options.state } }, { multi: true} );
  },
  removeThread: function(options) {
    options = options || {};
    if (! (this.userId && isAdminById(this.userId) ) )
      throw new Meteor.Error(403, "You must be admin to remove posts");

    var post = Posts.findOne(options.post_id);
    if (! post)
      throw new Meteor.Error(404, "No such post");

    Posts.remove({ root: post.root, slug: {$regex: post.slug }});
  }
});
