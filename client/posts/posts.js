Meteor.subscribe("posts");

_.extend(WeFi.router_func, {
  tag: function(tag, page) {
    Session.set('path', this.canonicalPath);
    var tags = (_.isString(tag) ? tag.split('-') : []);
    Session.set("postit_tags", tags.join(' '));
    Session.set("page_tags", tags.join(' '));
    Session.set('post_id', null);
    Session.set('postit_id', null);
    Session.set('page', page || 1);
    Session.set("tag-dir", "desc");
    WeFi.set_head( { 
      title: "posts tagged with " + _.map(tags, function(s) { return "'" + s + "'"; }).join(' and '),
      tags: tags 
    } );
    Session.set("routed_template", "home");
    return Session.get("routed_template");
  },
  post: function(id, slug) {
    Session.set('path', this.canonicalPath);
    if (_.isString(slug) && slug.match(/^[0-9a-f\-]+$/)) {
      Meteor.defer(function() {
	$("div." + slug).scrollintoview({ topPadding: 60 });
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
  }
});

Meteor.Router.add({
  "/post/:id": WeFi.router_func.post
  ,"/post/:id/:slug": WeFi.router_func.post
  ,"/tag/:tag": WeFi.router_func.tag
  ,"/tag/:tag/:page": WeFi.router_func.tag
  ,"/tag": function() {
    WeFi.set_head( { title: "All tags", tags: Session.get("all_tags") } );
    Session.set("routed_template", "all_tags");
    return Session.get("routed_template");
  }
});

_.extend(WeFi.query_func, {
  post_constraints: function() {
    var cons = { parent: null };

    var tags = Session.get("page_tags").split(' ');
    if (tags.length > 1) {
      cons['$and'] = _.map(tags, function(tag){ return { tags: tag } });
    } else {
      cons.tags = tags[0];
    }

    if (Session.get('hideClosed'))
      cons.state = { $ne: "closed" };

    var sorter = [['posted', Session.get('tag-dir')]];
    switch (Session.get('tag-sort')) {
    case "score":
      sorter.unshift(['score', Session.get('tag-dir')]);
      break;
    }
    return [cons, { sort: sorter } ];
  },
  edit_callback: function (event, template) {
    if($(event.target).hasClass('active')) {
      Session.set('showPostit', false);
    } else {
      Session.set('postit_id', template.data._id);
      Session.set('postit_mode', 'edit');
      Session.set("postit_body", template.data.body);
      Session.set("postit_tags", template.data.tags.join(' '));
      WeFi.postit_target = $(event.target);
      Session.set('showPostit', true);
      Session.set('createError', null);
    }
  }
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

Pagination.perPage(20);
Pagination.style('bootstrap');

Template.postlist.list = function() {
  var pc = WeFi.query_func.post_constraints();
  Pagination.currentPage(Session.get('page'));
  return Pagination.collection(Posts.find(pc[0], pc[1]).fetch());
};

Template.postlist.pagination = function () {
  var pc = WeFi.query_func.post_constraints();
  var count = Posts.find(pc[0], pc[1]).count();
  Pagination.currentPage(Session.get('page'));
  if (count && Pagination.totalPages(count, Pagination.perPage()) > 1)
    return Pagination.links('/tag/' + Session.get('page_tags').split(' ').join('-'), count);
};

Template.postlist.current_tags = function() {
  return Session.get('page_tags').split(' ');
};

Template.postLayout.events({
  'click .reply': function (event, template) {
    if($(event.target).hasClass('active')) {
      Session.set('showPostit', false);
    } else {
      Session.set('postit_id', template.data._id);
      Session.set('postit_mode', 'reply');
      Session.set("postit_body", undefined);
      Session.set("postit_tags", undefined);
      WeFi.postit_target = $(template.find(".reply"));
      Session.set('showPostit', true);
      Session.set('createError', null);
    }
  },
  'click .edit': WeFi.query_func.edit_callback,
  'click .admin-edit': WeFi.query_func.edit_callback,
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
    $("div." + template.data.parent).scrollintoview({ topPadding: 60 });
  }
});

Template.tags.distinct_tags = function() {
  return Session.equals("routed_template", "home" ) ? _.difference(this.tags, Session.get('page_tags').split(' ')) : this.tags;
};


Template.tags.events({
  'click button.tag': function (event, template) {
    Meteor.Router.to('/tag/' + this);
    return false;
  }
});

Template.postLayout.showReplyCount = function() {
  return ! Session.equals("routed_template", "post" )
};

Template.postLayout.commentCount = function () {
  return Posts.find({ $and: [ {root: this._id }, {_id: {$ne: this._id }} ] }).count();
};

Template.postLayout.showSubThread = function() {
  if (Session.equals("routed_template", "post" ) && this._id !== Session.get("post_id")) {
    var child = Posts.findOne({parent: this._id });
    if (child)
      return true;
  }
  return false;
};

Template.postLayout.depthIfThreaded = function() {
  return Session.equals("post-thread", "inline") ? (this.root == this._id ? 0 : 1) : this.depth;
};

Template.postLayout.inEditWindow = function () {
  var owner = Meteor.users.findOne(this.owner);
  if (owner && owner._id === Meteor.userId())
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
  return undefined;
};

Template.postLayout.canVote = function () {
  return Meteor.userId() && this.owner != Meteor.userId();
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
  return new Date(this.posted);
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
      $('#myTab a[href="#home"]').tab('show');
    } else {
      $('#profile').css('height', $('#home').outerHeight());
      $('#myTab a[href="#profile"]').tab('show');
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
	    if ( Session.get("routed_template") == "home" ) {
	      var p = Posts.findOne(post);
	      if (p.root == p._id)
		Meteor.Router.to("/post/" + p.root + "/" + p.url_slug);
	      else
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
  return Session.get("postit_tags");
};

Template.postit.body = function () {
  return Session.get("postit_body");
};

Template.about.events({
  'click button.post': function(e, t) { return WeFi.root_post_popup(e, t) }
});

Template.about.activeUsers = function() {
  return ActiveUsers.find({ userId: { $ne: Meteor.userId() } });
};

Template.all_tags.tags = function() {
  return Session.get('all_tags');
};
