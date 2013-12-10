---
layout: post
title: Configure Nginx with Avalanche Imagine Bundle
location: Lille, France
---

In this blog post, I will expose you how you should configure your Nginx in order to make it working the [Avalanche
Imagine Bundle](https://github.com/avalanche123/AvalancheImagineBundle).

This bundle is a great peace of code which allows to really ease backend images processing. For example, you can
generate a new thumbnail of a picture which will be created on the fly if it does not exist or will be simply returned
otherwise by simply defining a configuration node :)

To come back on the main topic, my first Nginx config try was the following (I have omit all optimization except the
one related to the bundle)

{% highlight nginx %}
server {
    root /var/www/current/web;
    server_name my-project.com;

    location / {
        try_files $uri @rewriteapp;
    }

    location @rewriteapp {
        rewrite ^(.*)$ /app.php/$1 last;
    }

    location ~ ^/(app|app_dev|app_test)\.php(/|$) {
        include fastcgi_params;

        fastcgi_pass unix:/var/run/php5-fpm.sock;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTPS off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|eot|svg|ttf|woff)$ {
        expires 1y;
    }
}
{% endhighlight %}

Here, the main point is I want to enable the Nginx HTTP header cache for all front-end assets. For that, I have added
the last location instruction which adds an expiration header of one year. The issue with this configuration is the
main instruction (ie. location /) does not match the assets anymore and so, are not processed by PHP-FPM causing
no assets generations on the fly...

To fix it, we need to rewrite the URI if the original one does not exist. For example, if your bundle cache assets
directory is `web/uploads/cache`, then, we need to add this instruction to Nginx:

{% highlight nginx %}
location ~ ^/uploads/cache {
    try_files $uri @rewriteapp;
}
{% endhighlight %}

You're done! Everything works and all assets will be rendered on the fly if it does not exist or will be directly
rendered by Nginx with an expiration of one year :)
