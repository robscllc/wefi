Meteor.subscribe("posts");
Meteor.subscribe("currentUser");
Meteor.subscribe("directory");
Meteor.subscribe("actives");

Meteor.Router.add({
  "/": function() {
    Session.set('path', this.canonicalPath);
    Session.set('post_id', null);
    Session.set('postit_id', null);
    Session.set('page', 1);
    Session.set('postit_tags', ['front_page']);
    Session.set('page_tags', ['front_page']);
    Session.set("tag-dir", "desc");
    WeFi.set_head( { tags: ['front_page'], rss: { href: '/tag/front_page.xml' } } );
    Session.set("routed_template", "posts_by_tag");
    return Session.get("routed_template");
  }
});

Meteor.startup(function() {
  WeFi.md_converter = new Markdown.getSanitizingConverter();
  Session.set("tag-sort", "date");
  Session.set("post-thread", "thread");

  Meteor.autorun(function() {
    var tags = _.chain(Posts.find().fetch()).pluck('tags').flatten().uniq()
      .compact().sortBy(
	function(tag) {
	  return tag;
	}).value();
    if (tags)
      Session.set("all_tags", _.toArray(tags));

    if (WeFi.isAdminById(Meteor.userId())) {
      var users = _.chain(Meteor.users.find().fetch()).map(WeFi.displayName)
	.value();
      if (users)
	Session.set("all_users", _.toArray(users));
    }
  });
});
