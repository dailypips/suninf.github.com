---
layout: article
title: Chrome Source Analyse - RefCount and SmartPtr
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
A thread-safe variant of RefCounted<T>

{% highlight c++ %}
template <class T, typename Traits = DefaultRefCountedThreadSafeTraits<T> >
class RefCountedThreadSafe;

class MyFoo : public base::RefCountedThreadSafe<MyFoo>
{};
{% endhighlight %}


##RefCountedData
A thread-safe wrapper for some piece of data so we can place other
things in scoped_refptrs<>.

{% highlight c++ %}
template<typename T>
class RefCountedData
    : public base::RefCountedThreadSafe< base::RefCountedData<T> > {
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
A smart pointer class for reference counted objects.  Use this class instead of calling *AddRef* and *Release* manually on a reference counted object to avoid common memory leaks caused by forgetting to Release an object
 reference.
scoped_refptrs is almost same with boost::intrusive_ptr, both need the object wrapped with AddRef / Release functions.

{% highlight c++ %}
template <class T>
class scoped_refptr;

class MyFoo : public RefCounted<MyFoo> {
...
};

void some_function() {
 scoped_refptr<MyFoo> foo = new MyFoo();
 foo->Method(param);
 // |foo| is released when this function returns
}
{% endhighlight %}





## make_scoped_refptr
Handy utility for creating a scoped_refptr<T> out of a T* explicitly without having to retype all the template arguments.

{% highlight c++ %}
template <typename T>
scoped_refptr<T> make_scoped_refptr(T* t) {
  return scoped_refptr<T>(t);
}
{% endhighlight %}






