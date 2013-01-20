Meteor.subscribe("directory");

Meteor.Router.add({
  "/": function() {
    Session.set('post_id', null);
    Session.set('reply_id', null);
    Session.set('page', 1);
    Session.set('tag', 'fpp');
    return 'home';
  }
});


Template.navbar.events({
  'click .post': function (event, template) {
    Session.set('reply_id', null);
    show_postit($(template.find(".post")));
    return false;
  }
});
