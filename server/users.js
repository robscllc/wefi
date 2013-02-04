Accounts.onCreateUser(function(options, user){
  user.profile = options.profile || {};

  if ( !Meteor.users.find().count() )
    user.is_admin = true;

  return user;
});
