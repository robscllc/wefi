Parties = new Meteor.Collection("parties");
Posts = new Meteor.Collection("posts");

///////////////////////////////////////////////////////////////////////////////
// Users

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
