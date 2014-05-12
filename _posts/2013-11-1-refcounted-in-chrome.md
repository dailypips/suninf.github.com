---
layout: article
title: RefCounted and Scoped_refptr in chrome
category: chrome
description: RefCount is a useful and common technique in c++, this article introduce RefCount and scoped_refptr in chrome source code.
---
*RefCount is a useful and common technique in c++, this article introduce `RefCount` and `scoped_refptr` in chrome source code ( [**ref_counted.h**{: style="color:#2970A6"}](http://src.chromium.org/viewvc/chrome/trunk/src/base/memory/ref_counted.h){: target="_blank"} ).*

##RefCounted
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
template
<
    class T,
    typename Traits = DefaultRefCountedThreadSafeTraits<T>
>
class RefCountedThreadSafe;

class MyFoo : public base::RefCountedThreadSafe<MyFoo>
{};
{% endhighlight %}


##RefCountedData
A thread-safe wrapper for some piece of data so we can place other things in scoped_refptrs&lt;>.

{% highlight c++ %}
template<typename T>
class RefCountedData
    : public base::RefCountedThreadSafe< base::RefCountedData<T> >
{
public:
    RefCountedData() : data() {}
    RefCountedData(const T& in_value) : data(in_value) {}

    T data;

private:
    friend class base::RefCountedThreadSafe<base::RefCountedData<T> >;
    ~RefCountedData() {}
};

scoped_refptrs< RefCountedData<std::string> >
	spRef = new RefCountedData<std::string>("my.test");
{% endhighlight %}


##scoped_refptr
A smart pointer class for reference counted objects.  Use this class instead of calling **AddRef** and **Release** manually on a reference counted object to avoid common memory leaks caused by forgetting to Release an object
 reference.

scoped_refptrs is almost same with **boost::intrusive_ptr**, both need objects which are wrapped with AddRef and Release functions.

{% highlight c++ %}
template <class T>
class scoped_refptr;

class MyFoo : public RefCounted<MyFoo>
{
...
};

void some_function()
{
    scoped_refptr<MyFoo> foo = new MyFoo();
    foo->Method(param);
    // |foo| is released when this function returns
}
{% endhighlight %}



## make_scoped_refptr
Handy utility for creating a scoped_refptr&lt;T> out of a T* explicitly without having to retype all the template arguments.

{% highlight c++ %}
template <typename T>
scoped_refptr<T> make_scoped_refptr(T* t)
{
    return scoped_refptr<T>(t);
}
{% endhighlight %}


## Link with boost::intrusive_ptr
As base::RefCounted&lt;T> class has AddRef and Release methods to manage ref count, we can easily wrap template functions `intrusive_ptr_add_ref` and `intrusive_ptr_release` to satisfy the requirements of intrusive_ptr.

{% highlight c++ %}
// Wrap add_ref or release for base::RefCounted Objects
#include <boost/intrusive_ptr.hpp>
namespace boost {
   template<typename T>
   inline void intrusive_ptr_add_ref( base::RefCounted<T> * p )
   {
      p->AddRef();
   }

   template<typename T>
   inline void intrusive_ptr_release( base::RefCounted<T> * p )
   {
      p->Release();
   }
}// namespace boost


// example
class MyFoo : public RefCounted<MyFoo>
{
    // ...
};

scoped_refptr<MyFoo> foo = new MyFoo();	// ref_count 1
{
    boost::intrusive_ptr<MyFoo> spFoo( foo.get() ); // ref_count 2
    // spFoo destroy out of the scope
}
// ref_count 1

{% endhighlight %}





