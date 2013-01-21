Posts = new Meteor.Collection("posts");

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
}

var displayName = function (user) {
  if (user.profile && user.profile.name)
    return user.profile.name;
  if (user.emails && user.emails.length)
    return user.emails[0].address;
  if (user)
    return user.username;
};

var contactEmail = function (user) {
  if (user.emails && user.emails.length)
    return user.emails[0].address;
  if (user.services && user.services.facebook && user.services.facebook.email)
    return user.services.facebook.email;
  return null;
};
