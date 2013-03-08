Meteor.publish('currentUser', function() {
  return Meteor.users.find(this.userId);
});

Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {profile: 1, username: 1}});
});

Meteor.publish("posts", function () {
  if (this.userId && WeFi.isAdminById(this.userId)) {
    return Posts.find();
  } else {
    return Posts.find({ $or: [{state: "active"}, { state: "closed"}]});
  }
});

Meteor.publish('userPresence', function() {
  // Setup some filter to find the users your logged in user
  // cares about. It's unlikely that you want to publish the 
  // presences of _all_ the users in the system.
  var filter = {}; 

  // ProTip: unless you need it, don't send lastSeen down as it'll make your 
  // templates constantly re-render (and use bandwidth)
  return Meteor.presences.find(filter, {fields: {state: true, userId: true}});
});

Posts.allow({
  insert: function (userId, post) {
    return false; // no cowboy inserts -- use createPost method
  },
  update: function (userId, posts, fields, modifier) {
    return false;
    return _.all(posts, function (post) {
      console.log(fields);
      if (! EJSON.equals(userId, post.owner))
        return false; // not the owner
      
      var allowed = ["body", "tags"];
      if (_.difference(fields, allowed).length)
        return false; // tried to write to forbidden field
      
      // A good improvement would be to validate the type of the new
      // value of the field (and if a string, the length.) In the
      // future Meteor will have a schema system to makes that easier.
      return true;
    });
  },
  remove: function (userId, posts) {
    return WeFi.isAdminById(userId);
    return ! _.any(posts, function (post) {
      return WeFi.isAdminById(userId);
    });
  }
});
