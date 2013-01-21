var converter = new Markdown.getSanitizingConverter();

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

Template.postlist.list = function() {
  Pagination.currentPage(Session.get('page'));
  var tags = Session.get('tag').split('/');
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

var showPostit = function(target) {
  $("#postit").show();
  $("#postit").css({
    position: "absolute"
  });
  $("#postit").position({
    my: "center top",
    at: "center bottom",
    of: target,
    collision: "fit none"
  });
  $("#postit").scrollintoview();
  $("#postit textarea.body").focus();
};

Template.postLayout.events({
  'click .reply': function (event, template) {
    Session.set('reply_id', template.data._id);
    showPostit($(template.find(".reply")));
    return false;
  },
  'click .remove': function () {
    Posts.remove(this._id);
    return false;
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
  if (this.body)
    return new Handlebars.SafeString(this.body);
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

Template.postit.rendered = function() { 
  var editor = new Markdown.Editor(converter);
  editor.run();
};

Template.postit.events({
  'click button.preview': function (event, template) {
    if($(event.target).hasClass('active')) {
      $('#myTab a[href="#home"]').tab('show');
    } else {
      $('#profile').css('height', $('#home').outerHeight()+10);
      $('#myTab a[href="#profile"]').tab('show');
    }      
  },
  'click button.cancel': function () {
    $("#postit").hide();
  },
  'click button.save': function (event, template) {
    var body = template.find(".body").value;

    if (body.length) {
      console.log(template.find(".tags").value.split(/\W+/));
      Meteor.call('createPost', {
        body: converter.makeHtml(body),
	tags: template.find(".tags").value.split(/\W+/),
	parent: Session.get('reply_id')
      }, function (error, post) {
        if (! error) {
	  Session.set("createError", null);
	  $("#postit").hide();
        }
      });
    } else {
      Session.set("createError",
                  "It needs a body, or why bother?");
    }
  },

  'click .cancel': function () {
    Session.set("createError", null);
  }
});

Template.postit.error = function () {
  return Session.get("createError");
};
