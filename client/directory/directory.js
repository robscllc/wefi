_.extend(WeFi.router_func, {
  user_history: function(user, page) {
    Session.set("directory_user", user);
    Session.set('page', page || 1);
    Session.set("post-thread", "inline");
    WeFi.set_head( { title: "Post history for user '" + WeFi.displayName(Template.user_history.user()) + "'" } );
    Session.set("routed_template", "user_history");
    return Session.get("routed_template");
  }
});

_.extend(WeFi.query_func, {
  user_history_constraints: function() {
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
  }
});

Meteor.Router.add({
  "/directory": function() {
    WeFi.set_head( { title: "User directory" } );
    Session.set("routed_template", "directory");
    return Session.get("routed_template");
  }
  ,"/directory/:user/history": WeFi.router_func.user_history
  ,"/directory/:user/history/:page": WeFi.router_func.user_history
});

Template.directory.users = function() {
  return Meteor.users.find({});
};

Template.user_history.user = function() {
  return Meteor.users.findOne(Session.get("directory_user"));
};

Template.user_history.list = function() {
  var pc = WeFi.query_func.user_history_constraints();
  Pagination.currentPage(Session.get('page')); 
  return Pagination.collection(Posts.find(pc[0], pc[1]).fetch());
};

Template.user_history.pagination = function () {
  var pc = WeFi.query_func.user_history_constraints();
  var count = Posts.find(pc[0], pc[1]).count();
  Pagination.currentPage(Session.get('page'));
  if (count && Pagination.totalPages(count, Pagination.perPage()) > 1)
    return Pagination.links('/directory/' + Session.get('directory_user') + '/history', count);
}
