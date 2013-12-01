---
layout: post
title: Doctrine2 entity listener as service in the Symfony2 container
location: Lille, France
---

Few weeks ago, I have migrated an application from Doctrine 2.3 to 2.4 & discover the
[entity listener](http://docs.doctrine-project.org/en/latest/reference/events.html#entity-listeners) feature.
This one is pretty interesting as it allows us to **map business logic to a specific entity** whereas before, we can
only attach this logic to the global event lifecycle. To explain you the gain it provides, I will try to explain it
from the beginning.

## Reminder

First, to enable this feature, we just need to configure it on our entities via xml, yaml or annotation and
implement the associated entity listeners.

For example, a `User` entity looks like:

{% highlight php %}
<?php
namespace Acme\DemoBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\EntityListeners({ "Acme\DemoBundle\Entity\Listener\UserListener" })
 */
class User
{
    // ....
}
{% endhighlight %}

And the associated entity listener looks like:

{% highlight php %}
<?php
namespace Acme\DemoBundle\Entity\Listener;

use Doctrine\ORM\Event\LifecycleEventArgs;
use Acme\DemoBundle\Entity\User;

class UserListener
{
    public function prePersist(User $user, LifecycleEventArgs $event)
    {
        // Checks the user is new.
        if ($user->getId() === null) {
            // Implement all logic needed in order to send a welcome email...
        }
    }
}
{% endhighlight %}

The goal of this listener is to send a welcome email when a user will be persisted for the first time. But here, we
face an issue because the logic we need to implement is already available in a dedicated service and duplicated code
is a bad practice! So, what can I do? Am I fucked?

## Entity Listener Resolver

Entity listener resolver to the rescue! This one is responsible to **retrieve the entity listener instance according to its name**
(ie. the class name provided as configuration) and can be overridden via the Doctrine2 bundle configuration :).So, we
can provide our own implementation which will resolve the entity listener in the Symfony2 container or fallback on the
default implementation if the listener can not be found in the container.

So, let's go for implementing it:

{% highlight php %}
<?php
namespace Acme\DemoBundle\Doctrine;

use Doctrine\ORM\Mapping\DefaultEntityListenerResolver;
use Symfony\Component\DependencyInjection\ContainerInterface;

class EntityListenerResolver extends DefaultEntityListenerResolver
{
    private $container;
    private $mapping;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
        $this->mapping = array();
    }

    public function addMapping($className, $service)
    {
        $this->mapping[$className] = $service;
    }

    public function resolve($className)
    {
        if (isset($this->mapping[$className]) && $this->container->has($this->mapping[$className])) {
            return $this->container->get($this->mapping[$className]);
        }

        return parent::resolve($className);
    }
}
{% endhighlight %}

The implementation is pretty simple but now, we need to configure it as default entity listener resolver. To do that,
we need to register the resolver as a service & configure it in the doctrine bundle:

{% highlight yaml %}
services:
    acme_demo.doctrine.entity_listener_resolver:
        class: Acme\DemoBundle\Doctrine\EntityListenerResolver
        arguments: [ "@service_container" ]

doctrine:
    orm:
        entity_listener_resolver: acme_demo.doctrine.entity_listener_resolver
{% endhighlight %}

## Register Entity Listeners

Everything is done, except probably the most important: **register the entity listeners on our resolver.** There is
only one way to do it, add a compiler pass which will register the listeners on the resolver. To identify the
listeners, we will simply tag them as `doctrine.entity_listener`.

The compiler pass implemenation will look like:

{% highlight php %}
<?php
namespace Acme\DemoBundle\DependencyInjection\Compiler;

use Symfony\Component\DependencyInjection\CompilerPass\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;

class DoctrineEntityListenerPass implements CompilerPassInterface
{
    public function process(ContainerBuilder $container)
    {
        $definition = $container->getDefinition('my.doctrine.entity_listener_resolver');
        $services = $container->findTaggedServiceIds('doctrine.entity_listener');

        foreach ($services as $service => $attributes) {
            $definition->addMethodCall(
                'addMapping',
                array($container->getDefinition($service)->getClass(), $service)
            );
        }
    }
}
{% endhighlight %}

Obviously, register the compiler pass:

{% highlight php %}
<?php
namespace Acme\DemoBundle;

use Acme\DemoBundle\DependencyInjection\Compiler\DoctrineEntityListenerPass;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Bundle\Bundle;

class AcmeDemoBundle extends Bundle
{
    public function build(ContainerBuilder $container)
    {
        parent::build($container);

        $container->addCompilerPass(new DoctrineEntityListenerPass());
    }
}
{% endhighlight %}

## Real Use Case

Then, everything is done! We can now inject what we want in all entity listeners. Let's go for finishing our user
entity listener started at the beginning of this blog post:

{% highlight php %}
<?php
namespace Acme\DemoBundle\Entity\Listener;

use Doctrine\ORM\Event\LifecycleEventArgs;
use Acme\DemoBundle\Entity\User;
use Acme\DemoBundle\Mailer\UserMailer;

class UserListener
{
    private $mailer;

    public function __construct(UserMailer $mailer)
    {
        $this->mailer = $mailer;
    }

    public function prePersist(User $user, LifecycleEventArgs $event)
    {
        if ($user->getId() === null) {
            $this->mailer->sendWelcome($user);
        }
    }
}
{% endhighlight %}

And the associated entity listener as service:

{% highlight yaml %}
services:
    acme_demo.entity_listener.user:
        class: Acme\DemoBundle\Entity\Listener\UserListener
        arguments: [ "@acme_demo.mailer.user" ]
        tags:
            -  { name: doctrine.entity_listener }
{% endhighlight %}

## Conclusion

It can seem pretty hard but if you have fully understood how the Symfony2 container works, it is in fact very simple!
Anyway, this little change will give you a **better integration of Doctrine2 in Symfony2**. Additionally, and probably
the most important point, you will be able to easily **decouple & reuse your business logic inside your application**!
