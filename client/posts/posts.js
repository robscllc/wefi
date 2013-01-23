var postit_target;

Meteor.subscribe("posts");

Meteor.Router.add({
  "/page/:page": function(page) {
    Session.set('page', page);
    Session.set('reply_id', null);
    return 'home';
  },
  "/post/:id": function(id) {
    Session.set('post_id', id);
    Session.set('reply_id', null);
    Session.set('page', 1);
    return 'post';
  },
  "/post/:id/:page": function(id, page) {
    Session.set('post_id', id);
    Session.set('reply_id', null);
    Session.set('page', page);
    return 'post';
  }
  ,"/tag/*": function(tag) {
    Session.set('post_id', null);
    Session.set('reply_id', null);
    Session.set('page', 1);
    Session.set('tag', tag);
    return 'home';
  }
});

Template.post.post = function() {
  var post = Posts.findOne(Session.get("post_id"));
  return post;
};

Template.comments.tree = function() {
  var pid = Session.get("post_id");
  //Pagination.currentPage(Session.get('page'));
  //return Pagination.collection(Posts.find({ $and: [ {root: pid } ] }, { sort: { full_slug: 1 } }).fetch());
  return Posts.find({ $and: [ {root: pid } ] }, { sort: { full_slug: 1 } });
};

Pagination.perPage(20);
Pagination.style('bootstrap');

var split_tags = function() { 
  var tags = Session.get("tag");
  if ( _.isString(tags) )
    return tags.split('/');
  return [];
};

Template.postlist.list = function() {
  Pagination.currentPage(Session.get('page'));
  var tags = split_tags();
  var cons = { parent: null };
  if (tags.length > 1) {
    cons['$and'] = _.map(tags, function(tag){ return { tags: tag } });
  } else {
    cons.tags = tags[0];
  }
  return Pagination.collection(Posts.find(cons, { sort: { posted: -1 } }).fetch());
};

Template.postlist.pagination = function () {
  Pagination.currentPage(Session.get('page'));
  // Pagination.links(prependRoute, cursorCount, options);
  var count = Posts.find({ parent: null }, { sort: { posted: -1 } }).count();
  if (count && Pagination.totalPages(count, Pagination.perPage()) > 1)
    return Pagination.links('/page', count);
}

Template.postlist.events({
  'click .new_post': function () {
    newPostDialog();
    return false;
  }
});

Template.postLayout.events({
  'click .reply': function (event, template) {
    Session.set('reply_id', template.data._id);
    postit_target = $(template.find(".reply"));
    Session.set('showPostit', true);
    Session.set('createError', null);
    return false;
  },
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
  }
});

Template.postLayout.isRoot = function() {
  return this._id === this.root;
};

Template.postLayout.isDifferentPost = function() {
  return this._id !== Session.get('post_id')
};

Template.postLayout.commentCount = function () {
  return Posts.find({ $and: [ {root: this._id }, {_id: {$ne: this._id }} ] }).count();
};

Template.postLayout.hasChildren = function () {
  return Posts.find({ $and: [ {parent: this._id } ] }).count() > 0;
};

Template.postLayout.postbody = function () {
  if (this.body && this.body_rendered)
    return new Handlebars.SafeString(this.body_rendered);
};

Template.postLayout.postuser = function () {
  var owner = Meteor.users.findOne(this.owner);
//  if (owner._id === Meteor.userId())
//    return "me";
  return displayName(owner);
};

Template.postLayout.timestamp = function () {
  return new Date(this.posted);
};

Template.postLayout.maybeState = function (what) {
  return what == this.state ? "active" : "";
};

Template.postit.rendered = function() {
  $("#postit").show();
  $("#postit").css({
    position: "absolute"
  });
  $("#postit").position({
    my: "center top",
    at: "center bottom",
    of: postit_target,
    collision: "fit none"
  });
  $("#postit").scrollintoview();
  $("#postit textarea.body").focus();
};

Template.postit.events({
  'click button.preview': function (event, template) {
    if($(event.target).hasClass('active')) {
      $('#myTab a[href="#home"]').tab('show');
    } else {
      $('#profile').css('height', $('#home').outerHeight()+10);
      $('#myTab a[href="#profile"]').tab('show');
      $(template.find('.preview')).html(md_converter.makeHtml(template.find(".body").value));
    }      
  },
  'click button.cancel': function () {
    Session.set('showPostit', false);
  },
  'click button.save': function (event, template) {
    var body = template.find(".body").value;
    if (body.length) {
      Meteor.call('createPost', {
        body: body,
	tags: template.find(".tags").value.split(/\W+/),
	parent: Session.get('reply_id')
      }, function (error, post) {
        if (error) {
	  Session.set("createError", error.reason);
	} else {
	  Session.set("createError", null);
	  Session.set('showPostit', false);
        }
      });
    } else {
      Session.set("createError",
                  "It needs a body, or why bother?");
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
  return split_tags().join(' ');
};

Template.postit.body = function () {
  return '';
};
