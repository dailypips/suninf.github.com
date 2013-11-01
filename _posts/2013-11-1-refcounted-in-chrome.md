---
layout: article
title: Chrome Source Analyse - RefCount / SmartPtr
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


##RefCountedThreadSafe
A thread-safe variant of RefCounted&lt;T>


{% highlight c++ %}
template <class T, typename Traits = DefaultRefCountedThreadSafeTraits<T> >
class RefCountedThreadSafe;

class MyFoo : public base::RefCountedThreadSafe<MyFoo>
{};
{% endhighlight %}






