---
layout: post
title: Welcome to the modern PHP 5.3+ Twitter libraries
location: Lille, France
---

Few weeks ago, I have reached a project which will need to deal with the Twitter REST API and further, with the Stream
one. The project itself is builded with PHP 5.5 and so, like a good developer, I have crawled the web in order
to find a library able to do the job in an elegant way. But, as you can guess, the result was pretty poor because every
of them was **build around a single class** without any real OOP in mind, **full of BC code** due mostly on a PHP 5.2
compatibility and I obviously omit to mention **missing/incomplete tests/docs**...

With this in mind and after discussing with my team, I have decided to build something new on top of PHP 5.3. This one
is the first release which introduces namespace and so, it will allow us to really structure our API and embrace the
last evolutions like the PSR-\*, the autoloading and so on. Additionally, it fixes lot of known bugs which would
require to write much more code...

## Overview

As you can imagine, trying to write an API which should be at the same time working, efficient, performant, realiable
and easy to use is not a simple job. Starting from the beginning, we have identified three totally different subjects
which should live on their own side/library: OAuth, REST and Stream. With this decoupling, you will be able to use all
of them as standalone components.

Additionally, all these libraries will need to send HTTP requests and so, will require a layer responsible of this
part. If we take a look over the current existent libraries, most of them have make the choice to directly use cURL
inside their core, making no extension point. Instead, we have decided to reuse a project called
[widop/http-adapter](https://github.com/widop/http-adapter) builded a year ago which allow to issue HTTP requests
(using internally the adapter pattern). This libraries currently supports the most popular HTTP clients as cURL,
Guzzle, Buzz, Zend, Stream...

Then, if we compute all these concepts together, we get this beautiful picture overview:

![Overview Picture](/assets/posts/2013-12-02-welcome-to-the-modern-php-twitter-libraries/overview.png)

## Twitter OAuth library

Maybe, we have already understood it but the OAuth protocol is mandatory if you want to interact with the Twitter APIs.
To resume, **all requests must be signed otherwise they will be simply rejected**. Here, we will see how to use the
library in a user context to get an access token from Twitter in order to sign our further requests.

For the neophyte, an access token represents the authorization made between a Twitter account and our Twitter
application for a specific level of permissions (read, write and/or direct message). Basically, Twitter will use it as
context for every request done (for example, if you send a statuses update request (tweet), Twitter will use the
Twitter account linked to the access token as base account in order to tweet the new status).

### Installation

So, now stop speaking, let's go for the code part. To install the library, like the majority (all?) PHP libraries, we
use [Composer](http://getcomposer.org/). If you're not already an addict, shame on you :). Basically, to make it
working, simply define a `composer.json` file at the root directory of your project:

{% highlight json %}
{
    "require": {
        "widop/twitter-oauth": "1.0.*@dev"
    }
}
{% endhighlight %}

After, install it:

{% highlight bash %}
$ composer install
{% endhighlight %}

Then, just need to require the generated `vendor/autoload.php` file and you're done!

### Set up a Client

Now the library is installed, you will need to set up a client according to your Twitter application configuration.
Basically, your application wraps two very important values: the consumer key and the consumer secret. These ones
simply represent your application credentials and so are very sensitive! Anyway, as you should understand, the client
needs them in order to identify your application :)

{% highlight php %}
<?php
use Widop\HttpAdapter\CurlHttpAdapter;
use Widop\Twitter\OAuth\OAuth;
use Widop\Twitter\OAuth\OAuthConsumer;
use Widop\Twitter\OAuth\Signature\OAuthHmacSha1Signature;

$oauth = new OAuth(
    new CurlHttpAdapter(),
    new OAuthConsumer('consumer_key', 'consumer_secret'),
    new OAuthHmacSha1Signature()
);
{% endhighlight %}

So difficult, you're already ready to play! As you have pointed out, the client needs an http adapter, a consumer
configuration and a signature. The library supports the HMAC SHA1, RSA SHA1 and PLAINTEXT signatures.

### Request a "Request Token"

The "Request Token" is the first step in the OAuth workflow. It represents the fact your application would like to get
an access token for a Twitter account. Technically, during this step, the first HTTP request will be send and the
response will be a token (key + secret) which will be required in all further steps and so, will need to be stored
somewhere...

{% highlight php %}
<?php
$requestToken = $oauth->getRequestToken('http://my-application.com/twitter-callback');

$_SESSION['twitter_request_token'] = serialize($requestToken);
{% endhighlight %}

As you can see, the token is serializable (like all tokens), then for convenience, we put it in session for further use
but you can obviously implement your own strategies. Additionally, the method takes as argument a callback URL which
will be used when Twitter will authorize our application in the next step.

### Authorize the application

Now, we have requested a request token, we need to redirect the user on Twitter in order to get the desired
permissions. To resume, the user will simply authorize the application to access its account.

{% highlight php %}
<?php
echo '<a href="'.$oauth->getAuthorizeUrl($requestToken).'">Authorize the application</a>';
{% endhighlight %}

When the user will click on the link, it will be redirected to twitter.com with everything configured in order to just
have to click on accept or cancel :) When it will accept, Twitter will redirect it on your callback URL previously
configured with a request parameter named `oauth_verifier`. This one will be required to complete the OAuth workflow
and will only be sent if the user has accepted the application.

### Get the "Access Token"

To finish the OAuth workflow, the last step is to retrieve the access token with the received oauth verifier.

{% highlight php %}
<?php
if (isset($_REQUEST['oauth_verifier'])) {
    $accessToken = $oauth->getAccessToken($requestToken, $_REQUEST['oauth_verifier']);
}
{% endhighlight %}

Here, we are! We have an access token fully valid, ready to be used in a REST or a Stream context :)

### Resume

You will say me, it's good to explain all these things but how can I use it in a simple PHP script? Here, a sample
integrating the full workflow in few lines of code:

{% highlight php %}
<?php
use Widop\HttpAdapter\CurlHttpAdapter;
use Widop\Twitter\OAuth;

$oauth = new OAuth\OAuth(
    new CurlHttpAdapter(),
    new OAuth\OAuthConsumer('consumer_key', 'consumer_secret'),
    new OAuth\Signature\OAuthHmacSha1Signature()
);

if (!isset($_SESSION['twitter_request_session'])) {
    $requestToken = $oauth->getRequestToken('http://my-app.com/twitter-callback.php')
    $_SESSION['twitter_request_session'] = serialize($requestToken);
} else {
    $requestToken = unserialize($_SESSION['twitter_request_token']);
}

if (isset($_REQUEST['oauth_verifier'])) {
    $accessToken = $oauth->getAccessToken($requestToken, $_REQUEST['oauth_verifier']);

    // Save the access token somewhere for further purpose!
}

echo '<a href="'.$oauth->getAuthorizeUrl($requestToken).'">Authorize the application</a>';
{% endhighlight %}

To conclude, the API does the job pretty well with an elegant, adaptive and robust architecture. Just give it a try
and you will adopt it! :)

## Twitter REST library

The Twitter REST library is totally different than the OAuth simply because it does not archive the same things. Its
main purpose is to send HTTP requests to the twitter end point in order to get/set informations. So, the library has
been designed following this way. Obviously, you must have an OAuth token (access token) in order to interact with
the REST API.

### Installation

As explain earlier in this blog post, we use [Composer](http://getcomposer.org/) to manage the installation part.

{% highlight json %}
{
    "require": {
        "widop/twitter-oauth": "1.0.*@dev",
        "widop/twitter-rest": "1.0.*@dev"
    }
}
{% endhighlight %}

Install them:

{% highlight bash %}
$ composer install
{% endhighlight %}

You're done!

### Set up a Client

To communicate with Twitter, you will need a REST client allowing you to send your requests.

{% highlight php %}
<?php
use Widop\HttpAdapter\CurlHttpAdapter;
use Widop\Twitter\OAuth;
use Widop\Twitter\Rest\Twitter;

$oauth = new OAuth\OAuth(
    new CurlHttpAdapter(),
    new OAuth\OAuthConsumer('consumer_key', 'consumer_secret'),
    new OAuth\Signature\OAuthHmacSha1Signature()
);

$token = new OAuth\OAuthToken('oauth_key', 'oauth_secret');

$twitter = new Twitter($oauth, $token);
{% endhighlight %}

A client only requires an OAuh client and an OAuth token in order to be able to sing/send your requests.
Nothing more :)

### Build a Request

Now, everything has been bootstrapped, we can build our very first request! In the Twitter REST library, each request
is a dedicated class which allows you to easily configure it without having to reread all the documentation... For
example, if you want to tweet a new status with a media, you can use the following snippet:

{% highlight php %}
<?php
use Widop\Twitter\Rest\Statuses\StatusesUpdateWithMediaRequest;

$request = new StatusesUpdateWithMediaRequest('My new status!', __DIR__.'/my-image.jpg');

$status = $request->getStatus();
$request->setStatus($status);

$media = $request->getMedia();
$request->setMedia($media);
{% endhighlight %}

The library currently supports more than 60 requests natively (making it pretty complete). The fact that each requests
is identified by a specific class, give you the ability to really easily play with the API!

### Send a Request

Our request is well configured, ready to send it to Twitter. Let's go!

{% highlight php %}
<?php
try {
    $response = $twitter->send($request);
} catch (\Exception $e) {
    // Something wrong happens
}
{% endhighlight %}

The method behavior is pretty simple, it throws an exception if there is an error and returns an array representing the
JSON result sent by Twitter. All requests work the same way!

### Resume

The REST API is dead simple to use. Just need to set up a client, build a request and then, send it. Here, an example
giving you an overview from the beginning:

{% highlight php %}
<?php
use Widop\HttpAdapter\CurlHttpAdapter;
use Widop\Twitter\OAuth;
use Widop\Twitter\Rest;

$oauth = new OAuth\OAuth(
    new CurlHttpAdapter(),
    new OAuth\OAuthConsumer('consumer_key', 'consumer_secret'),
    new OAuth\Signature\OAuthHmacSha1Signature()
);

$twitter = new Rest\Twitter(
    $oauth,
    new OAuth\OAuthToken('oauth_key', 'oauth_secret')
);

$request = new Rest\Statuses\StatusesDestroyRequest('12345');

try {
    $response = $twitter->send($request);
} catch (\Exception $e) {
    // Handle the error
}
{% endhighlight %}

One more time, give it a try and you will adopt it!

## Twitter Stream library

For the Stream library, to be honest, we are in a very early stage... Currently, it is a much more an idea than
something else :) Anyway, we will need it in few weeks and so, I will probably blog about it further, just to give
you a good picture of it!

## Conclusion

To conclude, I'm pretty happy of the result. I wouldn't have imagined we could build all these things in only four
weeks. I would like to thanks [@Geoffrey_Brier](https://twitter.com/Geoffrey_Brier) who have written most of the
Twitter REST requests. Thank you dude!

Now, it is simply your turn to give it a try and give us some feedbacks! :)
