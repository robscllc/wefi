WeFi.zfill = function (number, size) {
  number = number.toString();
  while (number.length < size) number = "0" + number;
      return number;
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

WeFi.findUser = function (name) {
  var user = Meteor.users.findOne( { _id: name } );
  if (user) return user;
  user = Meteor.users.findOne( { username: name } );
  if (user) return user;
  user = Meteor.users.findOne( { 'profile.name': name } );
  if (user) return user;
  return null;
};

WeFi.getPostUrl = function(post) {
  return Meteor.absoluteUrl("post/" + post._id + "/" + post.url_slug);
};
