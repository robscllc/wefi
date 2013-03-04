WeFi.view.posts_by_tag = {
  router: function(tag, page) {
    Session.set('path', this.canonicalPath);
    var tags = (_.isString(tag) ? tag.split('-') : []);
    Session.set("postit_tags", tags);
    Session.set("page_tags", tags);
    Session.set('post_id', null);
    Session.set('postit_id', null);
    Session.set('page', page || 1);
    Session.set("tag-dir", "desc");
    WeFi.set_head( { 
      title: "posts tagged with " + _.map(tags, function(s) { return "'" + s + "'"; }).join(' and '),
      tags: tags,
      rss: { href: this.canonicalPath + '.xml' }
    } );
    Session.set("routed_template", "posts_by_tag");
    return Session.get("routed_template");
  },
  constraints: function() {
    var cons = { parent: null };

    var tags = Session.get("page_tags");
    if (tags.length > 1) {
      cons['$and'] = _.map(tags, function(tag){ return { tags: tag } });
    } else {
      cons.tags = tags[0];
    }

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
  link: function() {
    return '/tag/' + (_.isArray(Session.get('page_tags')) ? Session.get('page_tags').join('-') : '');
  },
  description: function() { 
    return Template.tag_list({ current_tags: Session.get('page_tags'),
			       rss_url: Meteor.absoluteUrl(this.link().substr(1) + ".xml") });
  }
};

Meteor.Router.add({
  "/tag/:tag": WeFi.view.posts_by_tag.router
  ,"/tag/:tag/:page": WeFi.view.posts_by_tag.router
  ,"/tag": function() {
    WeFi.set_head( { title: "All tags", tags: Session.get("all_tags") } );
    Session.set("routed_template", "all_tags");
    return Session.get("routed_template");
  }
});

Template.all_tags.tags = function() {
  return Session.get('all_tags');
};
