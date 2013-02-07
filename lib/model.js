Posts = new Meteor.Collection("posts");
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

///////////////////////////////////////////////////////////////////////////////
// Users

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
  if (!user)
    return null;
  if (user.username)
    return user.username;
  if (user.profile && user.profile.name)
    return user.profile.name;
};
