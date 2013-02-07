_.extend(WeFi.router_func, {
  firehose: function(page) {
    Session.set('page', page || 1);
    Session.set("tag-dir", "desc");
    Session.set("post-thread", "inline");
    Session.set("routed_template", "firehose");
    return Session.get("routed_template");
  }
});

_.extend(WeFi.query_func, {
  firehose_constraints: function() {
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
  }
});

Meteor.Router.add({
  "/firehose": WeFi.router_func.firehose
  ,"/firehose/:page": WeFi.router_func.firehose
});

Template.firehose.list = function() {
  var pc = WeFi.query_func.firehose_constraints();
  Pagination.currentPage(Session.get('page')); 
  return Pagination.collection(Posts.find(pc[0], pc[1]).fetch());
};

Template.firehose.pagination = function () {
  var pc = WeFi.query_func.firehose_constraints();
  var count = Posts.find(pc[0], pc[1]).count();
  Pagination.currentPage(Session.get('page'));
  if (count && Pagination.totalPages(count, Pagination.perPage()) > 1)
    return Pagination.links('/firehose', count);
}
