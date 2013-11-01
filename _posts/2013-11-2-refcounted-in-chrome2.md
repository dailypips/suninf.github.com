---
layout: article
title: Chrome Source Analyse RefCount and SmartPtr2
category: chrome
---
#RefCounted
A base class for reference counted classes.

{% highlight c++ %}
template <class T>
class RefCounted;

class MyFoo : public base::RefCounted<MyFoo>
{};
{% endhighlight %}






