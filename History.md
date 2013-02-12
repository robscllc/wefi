## v0.1.10

* new collection ActiveUsers tracks the logged in users to the site
 * counting logged in sockets on the server by polling every 5 seconds
 * had to wrap Meteor.logout to remove the relevant ActiveUser rows
* linking to tag list from header bar
* removed 'Front page' from / dynamic title

## v0.1.9

* added dynamic title, keywords, and description to all pages
* added a bit of vertical margin to the post paragraphs
* fixed voteForPost split bug
* added google web tools verification file
* parent & sub-thread links no longer styled like buttons
* only hiding 'read n replies' link on post page
* showing all tags at /tag
 * blocked out typeahead & tagsearch, but hidden for now
* reply buttons show even if not logged in

## v0.1.8

* added:
 * spiderable package
 * explanatory header bar which also has pagination
 * post button to sidebar copy
 * firehose page that shows all posts
* preserving inputs in 'new post'
* slightly darker background for tags
* show 'New Post' button even if not logged in
* moved backup/release utils into tests/utils

## v0.1.7.5

* can't resize the post textarea anymore

## v0.1.7.4

* added displayName Handlebars helper

## v0.1.7.3

* using WeFi.displayName to show the name now
* directory uses user._id

## v0.1.7.2

* put the email settings on the server

## v0.1.7.1

* configured email settings

## v0.1.7

* a bunch of cosmetic changes
* cleaned up some garbage posts
* added user directory
* using the slug field as a anchor refernce if an object_id is passed in
* added abbreviated title
* added admin edit button
* removed delete-tag Xs
* removed 'Hide Closed' button
* replaced fpp with front_page

## v0.1.6

* img tags not allowed in posts
* made header tags smaller
* using scrollintoview to jump into and around post threads
  * added topPadding option to scrollintoview
* added routed_template to Session
* moved edit button back into footer & shortened button copy
* lightened footer text
* user table changes
  * not publishing email anymore
  * not using displayName anymore
* added title field to posts, determined by first header (h1, h2, etc)
* show first 1000 characters of rendered post by default,
  "read more" jquery link for rest (using jquery.expander.js)
* added url_slug to posts
* cleaned up parent & sub-thread buttons
  * parent link is now a button, not refreshing the page, just scrolling

## v0.1.5

* added sort buttons to nav bar
* added score_slug to db.posts
* added thread/inline option for posts
* renamed full_slug to date_slug
* added "Hide Closed" button
* only showing reply button if thread is active
* only post owner can see a tag's delete button
* moved edit window button to top right of post

## v0.1.4

* shared node module bugfix on server

## v0.1.3

* added shell script to deploy from tagged git

## v0.1.2

* server needs to have pagedown libs in public/

## v0.1.1

* keeping track of history in this file
