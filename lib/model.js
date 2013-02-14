Posts = new Meteor.Collection("posts");
ActiveUsers = new Meteor.Collection("actives");
WeFi = { router_func: {}, query_func: {} };

WeFi.zfill = function (number, size) {
  number = number.toString();
  while (number.length < size) number = "0" + number;
      return number;
};

WeFi.root_post_popup = function (event, template) {
  if($(event.target).hasClass('active')) {
    Session.set('showPostit', false);
  } else {
    Session.set('postit_id', null);
    Session.set('postit_mode', 'reply');
    Session.set("postit_body", undefined);
    WeFi.postit_target = $(template.find(".post"));
    Session.set('showPostit', true);
    Session.set('createError', null);
  }
};

WeFi.set_head = function(o) {
  o = o || {};
  var site_name = "Weeday Filler";
  $('title').text(o.title ? o.title + ' - ' + site_name : site_name);
  if (o.tags) {
    var kw = $('meta[name=keywords]');
    kw.attr("content", [o.tags, kw.attr('content')].join(', '));
  }
  if (o.description) {
    var kw = $('meta[name=description]');
    kw.attr("content", o.description);
  }
};

WeFi.scroll_to_post = function(selector) {
  var par = $(selector);
  if (par.length > 0) {
    par.scrollintoview({ topPadding: 60 })
      .animate({ backgroundColor: "#c0f5c0" }, 100 )
      .animate({ backgroundColor: "#f5f5f5" }, 8000 );
    return true;
  }
  return false;
};

WeFi.isAdminById = function(user_id) {
  var user = Meteor.users.findOne(user_id);
  return user && WeFi.isAdmin(user);
};

WeFi.isAdmin = function(user) {
  if(!user || typeof user === 'undefined')
    return false;
  return !!user.is_admin;
};

WeFi.displayName = function (user) {
  if (_.isString(user))
    user = Meteor.users.findOne(user)
  if (!user)
    return null;
  if (user.username)
    return user.username;
  if (user.profile && user.profile.name)
    return user.profile.name;
};
