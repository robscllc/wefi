Meteor.publish('currentUser', function() {
  return Meteor.users.find(this.userId);
});

Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {profile: 1, username: 1}});
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
  var fs = require('fs');
  var base = path.resolve('.');
  var isProd = fs.existsSync(base + '/static');

  WeFi.md_converter = require(base + (isProd ? "/static" : "/public") + "/thirdparty/pagedown/Markdown.Sanitizer").getSanitizingConverter();

  Posts.allow({
    insert: function (userId, post) {
      return false; // no cowboy inserts -- use createPost method
    },
    update: function (userId, posts, fields, modifier) {
      return false;
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

WeFi.max_posts = 1679616;
WeFi.max_score = 2176782336;
WeFi.max_slug_length = 200;

WeFi.encodeScoreSlug = function(n) {
  return WeFi.zfill(Math.floor(n + WeFi.max_score*.5).toString(36), 6);
};

WeFi.extend_body = function (o) {
  var html = WeFi.md_converter.makeHtml(o.body);
  var extend = { body_rendered: html, title: null, url_slug: null };
  var title = html.match(/<(h\d)>([\s\S]*?)<\/\1>/i);
  if (title)
    extend.title = String(title[2]).replace(/<\/?[^>]+>/g, '');
  var body_text = o.body.replace(/<(?:.|\n)*?>/gm, '');
  extend.url_slug = (title ? extend.title : body_text).substr(0, WeFi.max_slug_length).toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
  return _.extend( o, extend );
};

Meteor.methods({
  createPost: function (options) {
    options = options || {};
    if (! (typeof options.body === "string" &&
           options.body.length ))
      throw new Meteor.Error(400, "Required parameter missing");
    if (options.body.length > 100000)
      throw new Meteor.Error(413, "Body too long");
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");

    var par;
    if (options.parent)
      par = Posts.findOne(options.parent);

    if (par && par.state == 'closed')
      throw new Meteor.Error(403, "Parent post is closed");

    var tags = options.tags.split(/\W+/);
    var now = new Date();

    var post = Posts.insert(WeFi.extend_body({
      owner: this.userId,
      body: options.body,
      posted: now,
      state: 'active',
      parent: options.parent,
      slug: null,
      date_slug: null,
      score_slug: null,
      tags: tags,
      votes: [],
      score: 0
    }));

    var root = post;
    var depth = 0;
    var slug = WeFi.zfill(Math.floor(Math.random()*WeFi.max_posts).toString(36), 4);
    var date_slug = now.toJSON().replace(/[\D]/g, '') + ':' + slug;
    var score_slug = WeFi.encodeScoreSlug(0) + ':' + slug;
    if (par) {
      root = par.root;
      depth = par.depth + 1;
      slug = [par.slug, slug].join('/')
      date_slug = [par.date_slug, date_slug].join('/')
      score_slug = [par.score_slug, score_slug].join('/')
    }

    Posts.update(post, { $set: { 'root': root, 'depth': depth, 
				 'slug': slug, 'date_slug': date_slug, 
				 'score_slug': score_slug } });
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
  editPost: function (options) {
    options = options || {};
    if (! (typeof options.body === "string" &&
           options.body.length ))
      throw new Meteor.Error(400, "Required parameter missing");
    if (options.body.length > 1000)
      throw new Meteor.Error(413, "Body too long");
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");

    var tags = options.tags.split(/\W+/);
    var post = Posts.findOne(options.post_id);
    if (! post)
      throw new Meteor.Error(404, "No such post");

    if (this.userId !== post.owner)
      throw new Meteor.Error(404, "Not your post");

    if (((new Date()).getTime() - (new Date(post.posted)).getTime()) > 300000)
      throw new Meteor.Error(404, "Not in edit window");
      
    Posts.update(post, { $set: WeFi.extend_body({
      body: options.body, 
      tags: tags 
    }) });
  },
  voteForPost: function (options) {
    options = options || {};
    if (! _.contains(['up','down'], options.vote))
      throw new Meteor.Error(400, "Invalid vote");
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");

    var post = Posts.findOne(options.post_id);
    if (! post)
      throw new Meteor.Error(404, "No such post");

    var vote = Posts.findOne({_id: post._id, 
			      votes: { $elemMatch: { owner: this.userId } } },
			     { fields: { votes: 1 } });
    if (vote) {
      if (vote.votes[0].vote == 1) {
	if (options.vote == 'up') {
	  Posts.update({_id: post._id, 'votes.owner': this.userId},
		       { $inc: { score: -1 },
			 $pull: { votes: { owner: this.userId, vote: 1 } } });
	} else {
	  Posts.update({_id: post._id, 'votes.owner': this.userId},
		       { $inc: { score: -2 },
			 $set: { 'votes.$.vote': -1 } });
	}
      } else if (vote.votes[0].vote == -1) {
	if (options.vote == 'up') {
	  Posts.update({_id: post._id, 'votes.owner': this.userId},
		       { $inc: { score: 2 },
			 $set: { 'votes.$.vote': 1 } });
	} else {
	  Posts.update({_id: post._id, 'votes.owner': this.userId},
		       { $inc: { score: 1 },
			 $pull: { votes: { owner: this.userId, vote: -1 } } });
	}
	
      } else {
	if (options.vote == 'up') {
	  Posts.update({_id: post._id, 'votes.owner': this.userId},
		       { $inc: { score: 1 },
			 $set: { 'votes.$.vote': 1 } });
	} else {
	  Posts.update({_id: post._id, 'votes.owner': this.userId},
		       { $inc: { score: -1 },
			 $set: { 'votes.$.vote': -1 } });
	}
      }
    } else {
      var val = options.vote == 'up' ? 1 : -1;
      Posts.update(post, { $inc: { score: val },
			   $addToSet: { votes: { owner: this.userId, vote: val } } })
    }
    
    post = Posts.findOne(post._id);
    var mys = post.score_slug.split('/').pop();
    var arr = mys.split(':');
    var new_slug = [WeFi.encodeScoreSlug(0-post.score), arr[1]].join(':');
    var cursor = Posts.find({ root: post.root, score_slug: {$regex: mys }});
    cursor.forEach( function(p) {
      var new_full = p.score_slug;
      Posts.update(p, { $set: { score_slug: new_full.replace(mys, new_slug) } });
    });
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
