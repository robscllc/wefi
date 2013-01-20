Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1, profile: 1, username: 1}});
});

Meteor.publish("posts", function () {
  return Posts.find();
//    {$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]});
});
