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
