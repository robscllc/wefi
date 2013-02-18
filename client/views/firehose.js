WeFi.view.firehose = {
  router: function(page) {
    Session.set('page', page || 1);
    Session.set("tag-dir", "desc");
    //Session.set("post-thread", "inline");
    WeFi.set_head( { title: "All posts" } );
    Session.set("routed_template", "firehose");
    return Session.get("routed_template");
  },
  constraints: function() {
    var cons = { };
    
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
  link: '/firehose',
  description: function() { return 'All Posts' }
};

Meteor.Router.add({
  "/firehose": WeFi.view.firehose.router
  ,"/firehose/:page": WeFi.view.firehose.router
});
