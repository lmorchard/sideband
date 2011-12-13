# TODO

* Bookmarklet mode, for sharing and bookmarking

* Firefox Share activity handler, for sharing

* Date-based archives?

* Pagination of items

* Periodically refresh items, to catch changes from other devices

* Look for output templates in the destination bucket, to substitute for
  the default set

* Use the [File API][] to accept and upload files as enclosures

* Switchable storage & sync backends beyond S3
    * Use TwFile to save to local filesystem
    * webdav as an option?
    * Minimal S3 clone in single PHP file?
    * [Unhosted][]?

* More activity stream verb/object combos:
    * post
        * article, image, file, audio, video, note
    * share
        * article, bookmark, event, file, image, note
    * like 
        * audio, article, image, place, person, video
    * play
        * audio, video
    * save
        * bookmark, file
    * checkin
        * place + location
    * extensions?
        * mood, location, rating, source

[Unhosted]: http://unhosted.org/
[File API]: http://hacks.mozilla.org/2009/12/w3c-fileapi-in-firefox-3-6/
