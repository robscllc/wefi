var md_converter;

Meteor.subscribe("currentUser");
Meteor.subscribe("directory");

Meteor.Router.add({
  "/": function() {
    Session.set('post_id', null);
    Session.set('postit_id', null);
    Session.set('page', 1);
    Session.set('tag', 'fpp');
    return 'home';
  }
});

Template.navbar.events({
  'click .post': function (event, template) {
    Session.set('postit_id', null);
    Session.set('postit_mode', 'reply');
    Session.set("postit_body", undefined);
    postit_target = $(template.find(".post"));
    Session.set('showPostit', true);
    Session.set('createError', null);
   return false;
  }
});

Meteor.startup(function() {
  md_converter = new Markdown.getSanitizingConverter();
  $(".navbar .brand .anim").delay(1000).fadeOut(1000, 'easeInBack', function() { $(this).html('&nbsp;blog&nbsp;').fadeIn(1000, 'easeInBack') });
});
