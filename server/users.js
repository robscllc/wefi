Accounts.onCreateUser(function(options, user){
  user.profile = options.profile || {};

  if (options.email)
    user.profile.email = options.email;
    
  if (!user.profile.name)
    user.profile.name = user.username;
  
  if ( !Meteor.users.find().count() )
    user.is_admin = true;

  return user;
});
