Posts = new Meteor.Collection("posts");
WeFi = {};

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

var displayName = function (user) {
  if (user && user.username)
    return user.username;
  if (user.profile && user.profile.name)
    return user.profile.name;
  if (user.emails && user.emails.length)
    return user.emails[0].address;
};

var contactEmail = function (user) {
  if (user.emails && user.emails.length)
    return user.emails[0].address;
  if (user.services && user.services.facebook && user.services.facebook.email)
    return user.services.facebook.email;
  return null;
};
