Meteor.publish('currentUser', function() {
  return Meteor.users.findOne(this.userId);
});

Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1, profile: 1, username: 1}});
});

Meteor.publish("posts", function () {
  return Posts.find();
//    {$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]});
});

Meteor.startup(function() {

  Posts.allow({
    insert: function (userId, post) {
      return false; // no cowboy inserts -- use createPost method
    },
    update: function (userId, posts, fields, modifier) {
      return _.all(posts, function (post) {
	if (userId !== post.owner)
          return false; // not the owner
	
	var allowed = ["title", "description", "x", "y"];
	if (_.difference(fields, allowed).length)
          return false; // tried to write to forbidden field
	
	// A good improvement would be to validate the type of the new
	// value of the field (and if a string, the length.) In the
	// future Meteor will have a schema system to makes that easier.
	return true;
      });
    },
    remove: function (userId, posts) {
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

    var now = new Date();
    var post = Posts.insert({
      owner: this.userId,
      body: options.body,
      posted: now,
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
    if ( options.parent ) {
      var par = Posts.findOne(options.parent);
      if (par) {
	root = par.root;
	depth = par.depth + 1;
	slug = [par.slug, slug].join('/')
	full_slug = [par.full_slug, full_slug].join('/')
      }
    }

    Posts.update(post, { $set: { 'root': root, 'depth': depth, 
				 'slug': slug, 'full_slug': full_slug } });
    return post;
  }
});
