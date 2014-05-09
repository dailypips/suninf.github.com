---
layout: article
title: Lazy Instance in chrome
category: chrome
description: Lazy instance is an object which is created on the first time it's accessed. And chrome implements a very powerful LazyInstance template class, which is very fast and thread safe.
---
*Lazy instance is an object which is created on the first time it's accessed. And chrome implements a very powerful LazyInstance template class, which is very fast and `thread safe`. See detail in ( [**lazy_instance.h**{: style="color:#2970A6"}](http://src.chromium.org/viewvc/chrome/trunk/src/base/lazy_instance.h){: target="_blank"} ).*

## `LazyInstance<Type, Traits>`
The LazyInstance&lt;Type, Traits> class manages a single instance of Type, which will be lazily created on the first time it's accessed.

* This class is useful for places you would normally use a function-level static, but you need to have guaranteed thread-safety.
* The Type constructor will only ever be called once, even if two threads are racing to create the object.  Get() and Pointer() will always return the same, completely initialized instance.
* When the instance is constructed, it is registered with **AtExitManager**. The destructor will be called on program exit.

LazyInstance is completely **thread safe**, assuming that you create it safely. The class was designed to be POD initialized, so it shouldn't require a static constructor.  It really only makes sense to declare a LazyInstance as
a global variable using the **LAZY_INSTANCE_INITIALIZER** initializer.

## Compare with Singleton
* LazyInstance is similar to Singleton, except it does not have the singleton property.
* You can have multiple LazyInstance's of the same type, and each will manage a unique instance.
* It also preallocates the space for Type, as to avoid allocating the Type instance on the heap.  This may help with the performance of creating the instance, and reducing heap fragmentation.  This requires that Type be a complete type so we can determine the size.

## Example
{% highlight c++ %}
#include "base/at_exit.h"
#include "base/lazy_instance.h"

class MyClass
{
public:
    MyClass()
    {
        // enter constructor for each lazy instance
        m_val = 0;
    }
    void setVal(int n) { m_val = n; }
    int getVal() { return m_val; }

private:
    int m_val;
};

static base::LazyInstance<MyClass> inst_1 = LAZY_INSTANCE_INITIALIZER;
static base::LazyInstance<MyClass> inst_2 = LAZY_INSTANCE_INITIALIZER;

void LazyInstanceTest()
{
    // needed for lazy instance
    base::AtExitManager exit_mgr;

    inst_1.Get().setVal(5);
    int v1 = inst_1.Pointer()->getVal();

    inst_2.Get().setVal(10);
    int v2 = inst_2.Pointer()->getVal();
}
{% endhighlight %}


