// All Tomorrow's Parties -- client

Meteor.subscribe("directory");
Meteor.subscribe("parties");
Meteor.subscribe("posts");

Meteor.Router.add({
  "/": function() {
    Session.set('post_id', null);
    Session.set('reply_id', null);
    Session.set('page', 1);
    return 'home';
  },
  "/page/:page": function(page) {
    Session.set('page', page);
    Session.set('reply_id', null);
    return 'home';
  },
  "/post/:id": function(id) {
    Session.set('post_id', id);
    Session.set('reply_id', null);
    return 'post';
  }
});

var converter = new Markdown.getSanitizingConverter();

// If no party selected, select one.
Meteor.startup(function () {
  Meteor.autorun(function () {
    if (! Session.get("selected")) {
      var party = Parties.findOne();
      if (party)
        Session.set("selected", party._id);
    }
  });
});


// Posts

Template.post.post = function() {
  var post = Posts.findOne(Session.get("post_id"));
  return post;
};

Template.comments.tree = function() {
  var pid = Session.get("post_id");
  return Posts.find({ $and: [ {root: pid } ] }, { sort: { full_slug: 1 } });
};

Pagination.perPage(20);
Pagination.style('bootstrap');

Template.postlist.list = function() {
  Pagination.currentPage(Session.get('page'));
  return Pagination.collection(Posts.find({ parent: null }, { sort: { posted: -1 } }).fetch());
};

Template.postlist.pagination = function () {
  Pagination.currentPage(Session.get('page'));
  // Pagination.links(prependRoute, cursorCount, options);
  var count = Posts.find({ parent: null }, { sort: { posted: -1 } }).count();
  if (count && Pagination.totalPages(count, Pagination.perPage()) > 1)
    return Pagination.links('/page', count);
}

Template.postlist.events({
  'click .new_post': function () {
    newPostDialog();
    return false;
  }
});

Template.post_layout.events({
  'click .reply': function (event, template) {
    Session.set('reply_id', template.data._id);
    //var postit = $("#postit").detach();
    //postit.insertAfter($(template.find(".footer")));
    return false;
  }
});

Template.post_layout.is_root = function() {
  return this._id === this.root;
};

Template.post_layout.is_different_post = function() {
  return this._id !== Session.get('post_id')
};

Template.post_layout.comment_count = function () {
  return Posts.find({ $and: [ {root: this._id }, {_id: {$ne: this._id }} ] }).count();
};

Template.post_layout.has_children = function () {
  return Posts.find({ $and: [ {parent: this._id } ] }).count() > 0;
};

Template.post_layout.postbody = function () {
  if (this.body)
    return new Handlebars.SafeString(this.body);
};

Template.post_layout.postuser = function () {
  var owner = Meteor.users.findOne(this.owner);
//  if (owner._id === Meteor.userId())
//    return "me";
  return displayName(owner);
};

Template.post_layout.timestamp = function () {
  return new Date(this.posted);
};

var newPostDialog = function () {
  Session.set("createError", null);
  Session.set("newPostDialog", true);
};

Template.home.newPostDialog = function () {
  return Session.get("newPostDialog");
};

Template.postit.rendered = function() {
  var editor = new Markdown.Editor(converter);
  editor.run();
};

Template.postit.events({
  'click button.preview': function (event, template) {
    if($(event.target).hasClass('active')) {
      $('#myTab a[href="#home"]').tab('show');
    } else {
      $('#profile').css('height', $('#home').css('height'));
      $('#myTab a[href="#profile"]').tab('show');
    }      
  },
  'click .save': function (event, template) {
    var body = template.find(".body").value;

    if (body.length) {
      Meteor.call('createPost', {
        body: converter.makeHtml(body),
	parent: Session.get('reply_id') || Session.get('post_id')
      }, function (error, party) {
        if (! error) {
        }
      });
    } else {
      Session.set("createError",
                  "It needs a body, or why bother?");
    }
  },

  'click .cancel': function () {
    Session.set("newPostDialog", false);
  }
});

Template.newPostDialog.error = function () {
  return Session.get("createError");
};

///////////////////////////////////////////////////////////////////////////////
// Party details sidebar

Template.details.party = function () {
  return Parties.findOne(Session.get("selected"));
};

Template.details.anyParties = function () {
  return Parties.find().count() > 0;
};

Template.details.creatorName = function () {
  var owner = Meteor.users.findOne(this.owner);
  if (owner._id === Meteor.userId())
    return "me";
  return displayName(owner);
};

Template.details.canRemove = function () {
  return this.owner === Meteor.userId() && attending(this) === 0;
};

Template.details.maybeChosen = function (what) {
  var myRsvp = _.find(this.rsvps, function (r) {
    return r.user === Meteor.userId();
  }) || {};

  return what == myRsvp.rsvp ? "chosen btn-inverse" : "";
};

Template.details.events({
  'click .rsvp_yes': function () {
    Meteor.call("rsvp", Session.get("selected"), "yes");
    return false;
  },
  'click .rsvp_maybe': function () {
    Meteor.call("rsvp", Session.get("selected"), "maybe");
    return false;
  },
  'click .rsvp_no': function () {
    Meteor.call("rsvp", Session.get("selected"), "no");
    return false;
  },
  'click .invite': function () {
    openInviteDialog();
    return false;
  },
  'click .remove': function () {
    Parties.remove(this._id);
    return false;
  }
});

///////////////////////////////////////////////////////////////////////////////
// Party attendance widget

Template.attendance.rsvpName = function () {
  var user = Meteor.users.findOne(this.user);
  return displayName(user);
};

Template.attendance.outstandingInvitations = function () {
  var party = Parties.findOne(this._id);
  return Meteor.users.find({$and: [
    {_id: {$in: party.invited}}, // they're invited
    {_id: {$nin: _.pluck(party.rsvps, 'user')}} // but haven't RSVP'd
  ]});
};

Template.attendance.invitationName = function () {
  return displayName(this);
};

Template.attendance.rsvpIs = function (what) {
  return this.rsvp === what;
};

Template.attendance.nobody = function () {
  return ! this.public && (this.rsvps.length + this.invited.length === 0);
};

Template.attendance.canInvite = function () {
  return ! this.public && this.owner === Meteor.userId();
};

///////////////////////////////////////////////////////////////////////////////
// Map display

// Use jquery to get the position clicked relative to the map element.
var coordsRelativeToElement = function (element, event) {
  var offset = $(element).offset();
  var x = event.pageX - offset.left;
  var y = event.pageY - offset.top;
  return { x: x, y: y };
};

Template.map.events({
  'mousedown circle, mousedown text': function (event, template) {
    Session.set("selected", event.currentTarget.id);
  },
  'dblclick .map': function (event, template) {
    if (! Meteor.userId()) // must be logged in to create events
      return;
    var coords = coordsRelativeToElement(event.currentTarget, event);
    openCreateDialog(coords.x / 500, coords.y / 500);
  }
});

Template.map.rendered = function () {
  var self = this;
  self.node = self.find("svg");

  if (! self.handle) {
    self.handle = Meteor.autorun(function () {
      var selected = Session.get('selected');
      var selectedParty = selected && Parties.findOne(selected);
      var radius = function (party) {
        return 10 + Math.sqrt(attending(party)) * 10;
      };

      // Draw a circle for each party
      var updateCircles = function (group) {
        group.attr("id", function (party) { return party._id; })
        .attr("cx", function (party) { return party.x * 500; })
        .attr("cy", function (party) { return party.y * 500; })
        .attr("r", radius)
        .attr("class", function (party) {
          return party.public ? "public" : "private";
        })
        .style('opacity', function (party) {
          return selected === party._id ? 1 : 0.6;
        });
      };

      var circles = d3.select(self.node).select(".circles").selectAll("circle")
        .data(Parties.find().fetch(), function (party) { return party._id; });

      updateCircles(circles.enter().append("circle"));
      updateCircles(circles.transition().duration(250).ease("cubic-out"));
      circles.exit().transition().duration(250).attr("r", 0).remove();

      // Label each with the current attendance count
      var updateLabels = function (group) {
        group.attr("id", function (party) { return party._id; })
        .text(function (party) {return attending(party) || '';})
        .attr("x", function (party) { return party.x * 500; })
        .attr("y", function (party) { return party.y * 500 + radius(party)/2 })
        .style('font-size', function (party) {
          return radius(party) * 1.25 + "px";
        });
      };

      var labels = d3.select(self.node).select(".labels").selectAll("text")
        .data(Parties.find().fetch(), function (party) { return party._id; });

      updateLabels(labels.enter().append("text"));
      updateLabels(labels.transition().duration(250).ease("cubic-out"));
      labels.exit().remove();

      // Draw a dashed circle around the currently selected party, if any
      var callout = d3.select(self.node).select("circle.callout")
        .transition().duration(250).ease("cubic-out");
      if (selectedParty)
        callout.attr("cx", selectedParty.x * 500)
        .attr("cy", selectedParty.y * 500)
        .attr("r", radius(selectedParty) + 10)
        .attr("class", "callout")
        .attr("display", '');
      else
        callout.attr("display", 'none');
    });
  }
};

Template.map.destroyed = function () {
  this.handle && this.handle.stop();
};

///////////////////////////////////////////////////////////////////////////////
// Create Party dialog

var openCreateDialog = function (x, y) {
  Session.set("createCoords", {x: x, y: y});
  Session.set("createError", null);
  Session.set("showCreateDialog", true);
};

Template.home.showCreateDialog = function () {
  return Session.get("showCreateDialog");
};

Template.createDialog.events({
  'click .save': function (event, template) {
    var title = template.find(".title").value;
    var description = template.find(".description").value;
    var public = ! template.find(".private").checked;
    var coords = Session.get("createCoords");

    if (title.length && description.length) {
      Meteor.call('createParty', {
        title: title,
        description: description,
        x: coords.x,
        y: coords.y,
        public: public
      }, function (error, party) {
        if (! error) {
          Session.set("selected", party);
          if (! public && Meteor.users.find().count() > 1)
            openInviteDialog();
        }
      });
      Session.set("showCreateDialog", false);
    } else {
      Session.set("createError",
                  "It needs a title and a description, or why bother?");
    }
  },

  'click .cancel': function () {
    Session.set("showCreateDialog", false);
  }
});

Template.createDialog.error = function () {
  return Session.get("createError");
};

///////////////////////////////////////////////////////////////////////////////
// Invite dialog

var openInviteDialog = function () {
  Session.set("showInviteDialog", true);
};

Template.inviteDialog.events({
  'click .invite': function (event, template) {
    Meteor.call('invite', Session.get("selected"), this._id);
  },
  'click .done': function (event, template) {
    Session.set("showInviteDialog", false);
    return false;
  }
});

Template.inviteDialog.uninvited = function () {
  var party = Parties.findOne(Session.get("selected"));
  if (! party)
    return []; // party hasn't loaded yet
  return Meteor.users.find({$nor: [{_id: {$in: party.invited}},
                                   {_id: party.owner}]});
};

Template.inviteDialog.displayName = function () {
  return displayName(this);
};
