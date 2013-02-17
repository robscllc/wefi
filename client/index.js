Meteor.logout = _.wrap(Meteor.logout, function(logout) {
  var args = _.toArray(arguments).slice(1),
  origCallback = args[0];

  ActiveUsers.remove({ userId: Meteor.userId() });
  var newCallback = function(error) {
    origCallback.call(this, error);
  };
  
  logout(newCallback);
});

Template.navbar.events({
  'click button.post': function(e, t) { return WeFi.root_post_popup(e, t) },
  'click button.hide-closed': function (event, template) {
    if($(event.target).hasClass('active')) {
      Session.set('hideClosed', false);
    } else {
      Session.set('hideClosed', true);
    }
  },
  'click .sort .btn': function (event, template) {
    Session.set('tag-sort', $(event.target).text());
  },
  'click .dir .btn': function (event, template) {
    Session.set('tag-dir', $(event.target).text());
  },
  'click .thread .btn': function (event, template) {
    Session.set('post-thread', $(event.target).text());
  }
});

Template.navbar.helpers({
  activePage: function (page) {
    return Session.equals("path", page) ? "active" : "";
  },
  isActive: function (key) {
    return Session.equals(key, true) ? "active" : "";
  },
  maybe: function (key, val) {
    return Session.equals(key, val) ? "active" : "";
  }
});

Template.tagsearch.events({
  'click button.tag-btn': function (event, template) {
    return false;
  }
});

Template.tagsearch.rendered = function() {
  var template = this;
  Meteor.defer(function() {
    var b = Session.get("all_tags");
    if (b.length > 0) {
      $(template.find('input.tags')).typeahead( { source: b } );
    }
  });
};

Template.about.events({
  'click button.post': function(e, t) { return WeFi.root_post_popup(e, t) }
});

Template.about.activeUsers = function() {
  return ActiveUsers.find({ userId: { $ne: Meteor.userId() } });
};
