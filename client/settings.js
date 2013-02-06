Accounts.ui.config({
  requestPermissions: {
    facebook: ['user_likes'],
    github: ['user', 'repo']
  },
  requestOfflineToken: {
    google: true
  }
  ,passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
});

Accounts.config({
  sendVerificationEmail: true
});

Accounts.emailTemplates.siteName = "Weekday Filler";
Accounts.emailTemplates.from = "Weekday Filler Accounts <accounts@weekdayfiller.com>";
