---
layout: post
title: Announcing Ivory bundles Symfony 2.0 support removal
location: Lille, France
---

After the January 1, 2014, I will drop the Symfony 2.0 support for the
[IvoryGoogleMapBundle](https://github.com/egeloen/IvoryGoogleMapBundle) and the
[IvoryCKEditorBundle](https://github.com/egeloen/IvoryCKEditorBundle).

## What will it change?

Basically, in a first time, it will change nothing for you. You will still be able to install the older releases which
was compatible with all Symfony versions. So, your current Symfony 2.0 project will still work as before :)

The difference will be for bugfixes and new features which will only be accepted on the master branch (compatible with
Symfony >= 2.1). So, if you're still using Symfony 2.0, you must upgrade your application to Symfony 2.1 (at least) in
order to receive bugfixes and new features...

## Why?

Since a long time, I have kept/managed multiple branches in order to maintain a full Symfony2 compatibility on all my
bundles. This was mostly motivated by a large number of Symfony 2.0 projects which were still using it.

Anyway, only idiots never change their minds, I have decided to drop it mainly because **IT IS A PAIN TO MAINTAIN**.

As far as I remember, no contributions have been done on the right branch... I absolutely do not denigrate
contributions (I love them) but it really makes me bad when I have to fetch, rebase, resolve conflicts and so on...
I hope one day, I will be able to click on the merge pull request button for one of these two repositories :)

Additionally, the Symfony 2.0 has too much BC breaks (mostly located in the form component) which gives no way to
build an API compatible with all versions (whereas it is possible since Symfony 2.1).

Finally, and probably the most important part, the Symfony 2.0 release is no longer maintain by the Symfony team itself
so, I have decided to follow the same plan.

## Conclusion

If you're using Symfony >= 2.1, don't worry, you're not concerned but if you're still using Symfony 2.0, I recommend
you to migrate your application to Symfony 2.1 in order to get access to further bugfixes and new releases.

Merry Christmas and Happy New Year Symfony2 Community!
