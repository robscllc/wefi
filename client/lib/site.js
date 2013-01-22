Meteor.subscribe("currentUser");
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
    showPostit($(template.find(".post")));
    return false;
  }
});

Meteor.startup(function() {
  $(".navbar .brand .anim").delay(1000).fadeOut(1000, 'easeInBack', function() { $(this).html('&nbsp;blog&nbsp;').fadeIn(1000, 'easeInBack') });
});