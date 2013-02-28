WeFi.view.post = {
  router: function(id, slug) {
    Session.set('path', this.canonicalPath);
    if (_.isString(slug) && slug.match(/^[0-9a-zA-Z\-]+$/)) {
      Meteor.defer(function() {
	WeFi.scroll_to_post("div." + slug);
      });
    }
    Session.set('post_id', id);
    Session.set('postit_id', null);
    Session.set("tag-dir", "asc");
    var post = Posts.findOne(Session.get("post_id"));
    if (post)
      WeFi.set_head( { 
	title: post.title,
	description: post.body_text,
	tags: post.tags 
      } );
    Session.set("routed_template", "post");
    return Session.get("routed_template");
  },
  edit_callback: function (event, template) {
    if($(event.target).hasClass('active')) {
      Session.set('showPostit', false);
    } else {
      Session.set('postit_id', template.data._id);
      Session.set('postit_mode', 'edit');
      Session.set("postit_body", template.data.body);
      Session.set("postit_tags", template.data.tags);
      WeFi.postit_target = $(event.target);
      Session.set('showPostit', true);
      Session.set('createError', null);
    }
  }
};

Meteor.Router.add({
  "/post/:id": WeFi.view.post.router
  ,"/post/:id/:slug": WeFi.view.post.router
});

Template.post.post = function() {
  return Posts.findOne(Session.get("post_id"));
};

Template.post.tree = function() {
  var pid = Session.get("post_id");
  var post = Posts.findOne(Session.get("post_id"));
  var sorter = [[Session.equals("post-thread", "thread") ? 'date_slug' : 'posted', Session.get('tag-dir')]];
  switch (Session.get('tag-sort')) {
  case "score":
    sorter.unshift([Session.equals("post-thread", "thread") ?'score_slug' : 'score', Session.get('tag-dir')]);
    break;
  }
  return Posts.find({ $and: [ {root: post.root, slug: {$regex: post.slug } } ] }, { sort: sorter });
};

Template.postLayout.events({
  'click .reply': function (event, template) {
    if($(event.target).hasClass('active')) {
      Session.set('showPostit', false);
    } else {
      Session.set('postit_id', template.data._id);
      Session.set('postit_mode', 'reply');
      Session.set("postit_body", undefined);
      Session.set("postit_tags", []);
      WeFi.postit_target = $(template.find(".reply"));
      Session.set('showPostit', true);
      Session.set('createError', null);
    }
  },
  'click .edit': WeFi.view.post.edit_callback,
  'click .admin-edit': WeFi.view.post.edit_callback,
  'click .remove': function () {
    Meteor.call('removeThread', {
      post_id: this._id
    }, function (error, post) {
      if (! error) {
      }
    });
    return false;
  },
  'click .state .btn': function (event, template) {
    Meteor.call('setPostState', {
      post_id: this._id, 
      state: $(event.target).text()
    }, function (error, post) {
      if (! error) {
      }
    });
  },
  'click .up': function (event, template) {
    Meteor.call('voteForPost', {
      post_id: this._id, 
      vote: 'up'
    }, function (error, post) {
      if (! error) {
      }
    });
    return false;
  },
  'click .down': function (event, template) {
    Meteor.call('voteForPost', {
      post_id: this._id, 
      vote: 'down'
    }, function (error, post) {
      if (! error) {
      }
    });
    return false;
  },
  'click .parent': function (event, template) {
    if ( ! WeFi.scroll_to_post("div." + template.data.parent) ) {
      var p = Posts.findOne({ _id: template.data.parent });
      Meteor.Router.to("/post/" + p.root + "/" + p._id);
    }
  }
});

Template.tags.distinct_tags = function() {
  return Session.equals("routed_template", "posts_by_tag" ) ? _.difference(this.tags, Session.get('page_tags')) : this.tags;
};


Template.tags.events({
  'click button.tag': function (event, template) {
    Meteor.Router.to('/tag/' + this);
    return false;
  }
});

Template.postLayout.showReplyCount = function() {
  return ! Session.equals("routed_template", "post" ) && EJSON.equals(this._id, this.root);
};

Template.postLayout.commentCount = function () {
  return Posts.find({ $and: [ {root: this._id }, {_id: {$ne: this._id }} ] }).count();
};

Template.postLayout.cc_sp = function() {
  return Posts.find({ $and: [ {root: this._id }, {_id: {$ne: this._id }} ] }).count() === 1 ? 'reply' : 'replies';
};

Template.postLayout.showSubThread = function() {
  if (Session.equals("routed_template", "post" ) && ! EJSON.equals(this._id, Session.get("post_id"))) {
    var child = Posts.findOne({parent: this._id });
    if (child)
      return true;
  }
  return false;
};

Template.postLayout.depthIfThreaded = function() {
  return Session.equals("post-thread", "inline") ? (EJSON.equals(this.root, this._id) ? 0 : 1) : this.depth;
};

Template.postLayout.inEditWindow = function () {
  var owner = Meteor.users.findOne(this.owner);
  if (owner && EJSON.equals(owner._id, Meteor.userId()))
    return ((new Date()).getTime() - (new Date(this.posted)).getTime()) < 300000;
  return false;
};

Template.postLayout.abbrTitle = function () {
  var shorten = 40;
  var sub = this.title.substr(0, shorten);
  return new Handlebars.SafeString(sub + (sub.length < this.title.length ? ' &hellip;' : ''));
};

Template.postLayout.myVoteIs = function (val) {
  // no elemMatch in client :(
  // votes: { $elemMatch: { owner: Meteor.userId() } }
  var post = Posts.findOne({_id: this._id},
			   { fields: { votes: 1 } });
  if (post) {
    var vote = _.where(post.votes, { owner: Meteor.userId() });
    if (vote && vote.length)
      return (vote[0].vote == 1 ? 'up' : 'down') == val;
  }
  return null;
};

Template.postLayout.canVote = function () {
  return Meteor.userId() && ! EJSON.equals(this.owner, Meteor.userId());
};

Template.postLayout.editTimeRemaining = function () {
  var count = Math.floor(300 - ((new Date()).getTime() - (new Date(this.posted)).getTime()) / 1000);
  return Math.floor(count/60) + ':' + WeFi.zfill(Math.floor(count%60),2);
};

Template.postLayout.rendered = function() {
  $(this.find("abbr.timeago")).timeago();
  $(this.find("div.fullbody")).expander({
    expandEffect: 'show',
    expandSpeed: 0,
    collapseEffect: 'hide',
    collapseSpeed: 0
    ,slicePoint: 1000 
  });
  var rem = $(this.find('span.remaining'));
  var edit = $(this.find('button.edit'));
  if (rem) {
    $(function(){
      var ms = rem.text().split(':');
      var count = parseInt(ms[0])*60 + parseInt(ms[1]);
      var countdown = setInterval(function(){
	rem.text(Math.floor(count/60) + ':' + WeFi.zfill(Math.floor(count%60),2));
	if (count < 0) {
	  edit.hide();
	  clearInterval(countdown);
	} else {
	  edit.show();
	}
	count--;
      }, 1000);
    });
  }
};

Template.postLayout.postbody = function () {
  if (this.body && this.body_rendered)
    return new Handlebars.SafeString(this.body_rendered);
};

Template.postLayout.postuser = function () {
  return WeFi.displayName(Meteor.users.findOne(this.owner));
};

Template.postLayout.timestamp = function () {
  return this.posted.toISOString();
};

Template.postLayout.maybeState = function (what) {
  return what == this.state ? "active" : "";
};

Template.postLayout.isActive = function () {
  return this.state == "active";
};

Template.postit.rendered = function() {
  $("#postit").show();
  $("#postit").css({
    position: "absolute"
  });
  $("#postit").position({
    my: "center top",
    at: "center bottom",
    of: WeFi.postit_target,
    collision: "fit none"
  });
  $("#postit").scrollintoview({ topPadding: 60 });
  $("#postit textarea.body").focus();
};

Template.postit.events({
  'click button.preview': function (event, template) { 
   if($(event.target).hasClass('active')) {
      $('#myTab a[href="#editor"]').tab('show');
    } else {
      $('#preview').css('height', $('#editor').outerHeight());
      $('#myTab a[href="#preview"]').tab('show');
      $(template.find('.preview')).html(WeFi.md_converter.makeHtml(template.find(".body").value));
    }      
  },
  'click button.cancel': function () {
    Session.set('showPostit', false);
  },
  'click button.save': function (event, template) {
    var body = template.find(".body").value;
    if (body.length) {
      switch (Session.get('postit_mode')) {
      case "reply":
	Meteor.call('createPost', {
          body: body,
	  tags: template.find(".tags").value,
	  parent: Session.get('postit_id')
	}, function (error, post) {
          if (error) {
	    Session.set("createError", error.reason);
	  } else {
	    Session.set("createError", null);
	    Session.set('showPostit', false);
	    if ( ! Session.equals("routed_template", "post" ) ) {
	      var p = Posts.findOne(post);
	      if (!EJSON.equals(p.root, p._id))
		Meteor.Router.to("/post/" + p.root + "/" + p._id);
	    }
          }
	});
	break;
      case "edit":
	Meteor.call('editPost', {
          body: body,
	  tags: template.find(".tags").value,
	  post_id: Session.get('postit_id')
	}, function (error, post) {
          if (error) {
	    Session.set("createError", error.reason);
	  } else {
	    Session.set("createError", null);
	    Session.set('showPostit', false);
          }
	});
	break;
      }
    } else {
      Session.set("createError", "It needs a body, or why bother?");
    }
  }
});

Template.postit.showPostit = function() {
  return Session.get('showPostit');
};

Template.postit.error = function () {
  return Session.get("createError");
};

Template.postit.tags = function () {
  return _.isArray(Session.get("postit_tags")) ? Session.get("postit_tags").join(" ") : '';
};

Template.postit.body = function () {
  return Session.get("postit_body");
};
