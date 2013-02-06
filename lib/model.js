Posts = new Meteor.Collection("posts");
WeFi = { router_func: {}, query_func: {} };

WeFi.zfill = function (number, size) {
  number = number.toString();
  while (number.length < size) number = "0" + number;
      return number;
};

///////////////////////////////////////////////////////////////////////////////
// Users

var isAdminById = function(user_id) {
  var user = Meteor.users.findOne(user_id);
  return user && isAdmin(user);
};

var isAdmin = function(user) {
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
