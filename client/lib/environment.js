WeFi = { view: {} };

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

Pagination.perPage(20);
//Pagination.style('bootstrap');
