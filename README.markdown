## What is this?

This is a tool for publishing a personal microblog or activity stream from a
modern browser to an S3 bucket.

This is also an experiment in using [Activity Streams][as], and in building an
[Open Web Application][owa] atop Amazon S3.

## Why is this interesting?

This app requires a device with a modern browser and Amazon S3 to publish an
activity stream on the web. Through the magic of REST, AJAX, cryptography, and
an additional buzzword bingo assemblage of Open Web technologies, you need
neither set up a server nor install any software on your computer.

## How do I use it?

I plan to write a friendlier guide to this thing when it matures, but here's
the skinny:

* [Sign up for AWS][signup], if you haven't already.

* [Create a bucket in S3][s3], remember what you named it.

    * Bonus points: If you name the bucket after a domain name you control (eg.
      [`stream.lmorchard.com`][stream] is mine), you can [set up a CNAME with
      your DNS provider][s3website] to customize the URL to your activity
      stream.

* [Get your Access Keys][accesskeys] (ie. Key ID and Secret
    Access Key)
    
    * Bonus points: For safer usage, [create a new user with IAM][iam] that has
      only S3 read/write access to the bucket you just created, and use the set
      of Access Keys for that user
        
* [Register with this app][register], using your earlier-created bucket, a new
  username and password, and your AWS Access Credentials. Also, fill out the
  biographical profile details, since those will be published with your stream.

* [Login with your username and password][login] on a modern desktop or mobile
  browser, post activities and behold the publishing magic.

## Wait, what? Is this secure?

The short answer is: I don't know how secure this is. It might not be. You tell me!

Why register? And what happens to your valuable and sensitive AWS credentials?
Those credentials—and your biographical details—are really too long to remember
and cumbersome to type repeatedly, or at all on a mobile device. But, this app
still needs them. So, a username and password are a bit more friendly,
memorable, and familiar.

This is a compromise between usability and protecting your Access
Credentials—but I may be mistaken and might have instead compromised the keys
to your AWS account altogether.  You decide:

When you "register", the data your submit is encrypted with your password,
using [AES][].  That encrypted bundle is then stored on S3 with an URL based on
a SHA1 hash of your username.  That resource is world-readable.

Later, when you "login", the encrypted bundle is fetched with your username and
your password is used to decrypt it. This supplies the app with your AWS
Credentials, along with preferences and your biographical profile information.

(I stole this idea from [Jacob Wright][jacwright], by the way.) 

If you're paranoid (and you should be), this is why I mentioned [using IAM to
create a new user][iam] earlier.  This is an experiment, and though I promise
I'm not going to do anything malicious, you might not want to trust that I know
what I'm doing.  If you create a limited-permission set of credentials, the
damage can be minimized in case I'm totally mistaken about what I'm doing here.

## Miscellanea and credits

* [Fork me on GitHub][source]

* The name derives from [Dave Winer's Radio2][radio2], a minimalist blogging
  tool that inspires this app.

    * [Sideband][wp_sideband], per Wikipedia, is "a refinement of amplitude
      modulation that more efficiently uses electrical power and bandwidth."

    * The name also comes from 
      [my comparison of self-hosted social software to ham radio][ham].

* The icon came from [a photo on Flickr by Plings][karate], by way of a search
  for Creative Commons images matching "activity". I might look for another
  that relates more to radio.

[as]: http://activitystrea.ms/
[wp_sideband]: http://en.wikipedia.org/wiki/Single-sideband_modulation
[radio2]: http://r2.reallysimple.org/howto/radio2/
[karate]: http://www.flickr.com/photos/plings/3686021223/
[owa]: https://apps.mozillalabs.com/
[signup]: http://aws.amazon.com/
[s3]: https://console.aws.amazon.com/s3/home
[iam]: https://console.aws.amazon.com/iam/home
[s3website]: http://aws.typepad.com/aws/2011/02/host-your-static-website-on-amazon-s3.html
[stream]: http://stream.lmorchard.com
[accesskeys]: https://aws-portal.amazon.com/gp/aws/developer/account/index.html?action=access-key#access_credentials
[register]: http://s3.amazonaws.com/app.html#register
[login]: http://s3.amazonaws.com/app.html#login
[jacwright]: http://jacwright.com/556/client-side-only-javascript-amazon-s3-cms/
[aes]: https://github.com/mdp/gibberish-aes
[source]: https://github.com/lmorchard/sideband
[ham]: http://bit.ly/uEqpu4
