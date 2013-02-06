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
