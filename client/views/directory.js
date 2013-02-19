WeFi.view.user_history = {
  router: function(user, page) {
    Session.set("directory_user", user);
    Session.set('page', page || 1);
    //Session.set("post-thread", "inline");
    WeFi.set_head( { title: "Post history for user '" + WeFi.displayName(Session.get("directory_user")) + "'" } );
    Session.set("routed_template", "user_history");
    return Session.get("routed_template");
  },
  constraints: function() {
    var user = Meteor.users.findOne(Session.get("directory_user"));
    if (user) {
      var cons = { owner: user._id };

      if (Session.get('hideClosed'))
	cons.state = { $ne: "closed" };
      
      var sorter = [['posted', Session.get('tag-dir')]];
      switch (Session.get('tag-sort')) {
      case "score":
	sorter.unshift(['score', Session.get('tag-dir')]);
	break;
      }
      return [cons, { sort: sorter } ];
    }
    return [{_id: 0}, {}];
  },
  link: function() {
    return '/directory/' + Session.get('directory_user') + '/history';
  },
  description: function() { return 'Posts by: ' + WeFi.displayName(Session.get("directory_user")) }
};
  
Meteor.Router.add({
  "/directory": function() {
    WeFi.set_head( { title: "User directory" } );
    Session.set("routed_template", "directory");
    return Session.get("routed_template");
  }
  ,"/directory/:user/history": WeFi.view.user_history.router
  ,"/directory/:user/history/:page": WeFi.view.user_history.router
});

Template.directory.users = function() {
  return Meteor.users.find({});
};
