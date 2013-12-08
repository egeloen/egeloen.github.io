---
layout: post
title: Unit test your Symfony2 bundle DI like a boss!
location: Lille, France
---

Since the beginning of Symfony2, I have looked for a solution in order to easily unit test my dependency injection
according to some defined configurations (xml and yaml). Basically, the main purpose of the configuration is to update
dynamically the state of the container (add/remove/update services or parameters) and so, it is a **very important part
of the bundle which should definitively be tested**!

In this blog post, I will expose you the solution I use in most of my bundles in order to unit test this part through
[PHPUnit](https://github.com/sebastianbergmann/phpunit/) :)

## Real use case

To understand more easily how it works, the best solution is to make a real use case. Here, a configuration allowing to
enable/disable services (disabled by default):

{% highlight php %}
<?php
// src/Acme/DemoBundle/DependencyInjection/Configuration.php
namespace Acme\DemoBundle\DependencyInjection;

use Symfony\Component\Config\Definition\ConfigurationInterface;
use Symfony\Component\Config\Definition\Builder\TreeBuilder;

class Configuration implements ConfigurationInterface
{
    public function getConfigTreeBuilder()
    {
        $treeBuilder = new TreeBuilder();
        $treeBuilder
            ->root('acme_demo')
            ->children()
                ->booleanNode('enabled')
                    ->defaultFalse()
                ->end()
            ->end();

        return $treeBuilder;
    }
}
{% endhighlight %}

The extension using the configuration:

{% highlight php %}
<?php
// src/Acme/DemoBundle/DependencyInjection/AcmeDemoExtension.php
namespace Acme\DemoBundle\DependencyInjection;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\Extension;
use Symfony\Component\DependencyInjection\Loader\XmlFileLoader;
use Symfony\Component\Config\FileLocator;

class AcmeDemoExtension extends Extension
{
    public function load(array $configs, ContainerBuilder $container)
    {
        $config = $this->processConfiguration(new Configuration(), $configs);

        if ($config['enabled']) {
            $loader = new XmlFileLoader($container, new FileLocator(__DIR__.'/../Resources/config/'));
            $loader->load('services.xml');
        }
    }
}
{% endhighlight %}

And the services loaded by the extension:

{% highlight xml %}
<container
    xmlns="http://symfony.com/schema/dic/services"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://symfony.com/schema/dic/services http://symfony.com/schema/dic/services/services-1.0.xsd"
>
    <services>
        <service id="acme_demo.test" class="An\Awesome\Class" />
    </services>
</container>
{% endhighlight %}

The code is dead simple and will allow us to focus on the design of the tests more easily :)

## Create your abstract tests

What? Abstract tests? Yeah, don't be afraid :) Basically, we want to be able to tests our DI extension behavior
according to different configuration types (xml and yaml)... With PHPUnit, the only way to archive that (without code
duplication) is to use the inheritance mechanism.

In fact, we will define our main tests in the abstract class and apply them to different concrete classes which only
have to load configuration. Making it this way will enforce the fact all behaviors can be archive the same way by each
configuration :)

So, the abstract implementation will look like:

{% highlight php %}
<?php
// src/Acme/DemoBundle/Tests/DependencyInjection/AbstractAcmeDemoExtensionTest.php
namespace Acme\DemoBundle\Tests\DependencyInjection;

use Acme\DemoBundle\DependencyInjection\AcmeDemoExtension;
use Symfony\Component\DependencyInjection\ContainerBuilder;

abstract class AbstractAcmeDemoExtensionTest extends \PHPUnit_Framework_TestCase
{
    private $extension;
    private $container;

    protected function setUp()
    {
        $this->extension = new AcmeDemoExtension();

        $this->container = new ContainerBuilder();
        $this->container->registerExtension($this->extension);
    }

    abstract protected function loadConfiguration(ContainerBuilder $container, $resource);

    public function testWithoutConfiguration()
    {
        // An extension is only loaded in the container if a configuration is provided for it.
        // Then, we need to explicitely load it.
        $this->container->loadFromExtension($this->extension->getAlias());
        $this->container->compile();

        $this->assertFalse($this->container->has('acme_demo.test'));
    }

    public function testDisabledConfiguration()
    {
        $this->loadConfiguration($this->container, 'disabled');
        $this->container->compile();

        $this->assertFalse($this->container->has('acme_demo.test'));
    }

    public function testEnabledConfiguration()
    {
        $this->loadConfiguration($this->container, 'enabled');
        $this->container->compile();

        $this->assertTrue($this->container->has('acme_demo.test'));
    }
}
{% endhighlight %}

## Create your concrete tests

As I just explain, the purpose of the concrete tests is to load a configuration according to a type (xml or yaml). In
theory, this is its only goal, meaning **no tests should live in these classes**.

### Xml

The Xml DI test case looks like:

{% highlight php %}
<?php
// src/Acme/DemoBundle/Tests/DependencyInjection/XmlAcmeDemoExtensionTest.php
namespace Acme\DemoBundle\Tests\DependencyInjection;

use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\XmlFileLoader;

class XmlAcmeDemoExtensionTest extends AbstractAcmeDemoExtensionTest
{
    protected function loadConfiguration(ContainerBuilder $container, $resource)
    {
        $loader = new XmlFileLoader($container, new FileLocator(__DIR__.'/Fixtures/Xml/'));
        $loader->load($configuration.'.xml');
    }
}
{% endhighlight %}

You must additionally create the associated xml configurations.

Disabled configuration:

{% highlight xml %}
<!-- src/Acme/DemoBundle/Tests/DependencyInjection/Fixtures/Xml/disabled.xml -->
<container
    xmlns="http://symfony.com/schema/dic/services"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:acme-demo="http://your-domain/schema"
    xsi:schemaLocation="http://symfony.com/schema/dic/services http://symfony.com/schema/dic/services/services-1.0.xsd
                        http://your-domain/schema http://your-domain/schema/acme-demo.xsd"
>
    <acme-demo:config enabled="false" />
</container>
{% endhighlight %}

Enabled configuration:

{% highlight xml %}
<!-- src/Acme/DemoBundle/Tests/DependencyInjection/Fixtures/Xml/enabled.xml -->
<container
    xmlns="http://symfony.com/schema/dic/services"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:acme-demo="http://your-domain/schema"
    xsi:schemaLocation="http://symfony.com/schema/dic/services http://symfony.com/schema/dic/services/services-1.0.xsd
                        http://your-domain/schema http://your-domain/schema/acme-demo.xsd"
>
    <acme-demo:config enabled="true" />
</container>
{% endhighlight %}

### Yaml

The Yaml DI test case looks like:

{% highlight php %}
<?php
// src/Acme/DemoBundle/Tests/DependencyInjection/YamlAcmeDemoExtensionTest.php
namespace Acme\DemoBundle\Tests\DependencyInjection;

use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

class YamlAcmeDemoExtensionTest extends AbstractAcmeDemoExtensionTest
{
    protected function loadConfiguration(ContainerBuilder $container, $resource)
    {
        $loader = new YamlFileLoader($container, new FileLocator(__DIR__.'/Fixtures/Yaml/'));
        $loader->load($configuration.'.yml');
    }
}
{% endhighlight %}

You must additionally create the associated yaml configurations.

Disabled configuration:

{% highlight yaml %}
# src/Acme/DemoBundle/Tests/DependencyInjection/Fixtures/Yaml/disabled.yml
acme_demo:
    enabled: false
{% endhighlight %}

Enabled configuration:

{% highlight yaml %}
# src/Acme/DemoBundle/Tests/DependencyInjection/Fixtures/Yaml/enabled.yml
acme_demo:
    enabled: true
{% endhighlight %}

## Conclusion

You're done! Everything is covered! This architecture provides an efficient, flexible and robust way in order to easily
test your DI extension behaviors according to different configuration types with the predicate all of them work the
same way.

Now, It is simply your turn to test your Symfony2 bundle DI extension :)
