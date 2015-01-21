---
layout: article
title: Scoped_ptr in chrome
category: chrome
---
Smart_ptr are useful in C++ for auto-manage of memory, this article introduce `scoped_ptr` in chrome source code.

Scopers help you manage ownership of a pointer, helping you easily manage the a pointer within a scope, and automatically destroying the pointer at the end of a scope.

## Auto management of ownership
{% highlight c++ %}

// scoped_ptr<T>
{
     scoped_ptr<Foo> foo(new Foo("wee"));
}  // foo goes out of scope, releasing the pointer with it.

{
    scoped_ptr<Foo> foo;          // No pointer managed.
    foo.reset(new Foo("wee"));    // Now a pointer is managed.
    foo.reset(new Foo("wee2"));   // Foo("wee") was destroyed.
    foo.reset(new Foo("wee3"));   // Foo("wee2") was destroyed.
    foo->Method();                // Foo::Method() called.
    foo.get()->Method();          // Foo::Method() called.
    // SomeFunc takes ownership, foo no longer
    SomeFunc(foo.release());
                               // manages a pointer.
    foo.reset(new Foo("wee4"));   // foo manages a pointer again.
    foo.reset();       // Foo("wee4") destroyed, foo no longer
                               // manages a pointer.
}  // foo wasn't managing a pointer, so nothing was destroyed.

// scoped_ptr<T[]>
{
    scoped_ptr<Foo[]> foo(new Foo[100]);
    foo.get()->Method();  // Foo::Method on the 0th element.
    foo[10].Method();     // Foo::Method on the 10th element.
}
{% endhighlight %}


## Movable but not copyable
(see detail in [**Move Constructor**{: style="color:#2970A6"}](http://suninf.net/move-constructor-in-chrome/))

* Scoped_ptr also implements `movable but not copyable`. You can use the scoped_ptr in the parameter and return types of functions to signify ownership transfer in to and out of a function.
* When calling a function that has a scoper as the argument type, it must be called with the result of an analogous scoper's **Pass()** function or another function that generates a **temporary**; passing by copy will NOT work.

Here is an example using scoped_ptr:
{% highlight c++ %}
void TakesOwnership(scoped_ptr<Foo> arg)
{
    // Do something with arg
}

scoped_ptr<Foo> CreateFoo()
{
    // No need for calling Pass() for a temporary return value.
    return scoped_ptr<Foo>(new Foo("new"));
}

scoped_ptr<Foo> PassThru(scoped_ptr<Foo> arg)
{
    return arg.Pass();
}

{
    scoped_ptr<Foo> ptr(new Foo("yay")); // ptr manages Foo("yay").
    TakesOwnership(ptr.Pass());   // ptr no longer owns Foo("yay").
    scoped_ptr<Foo> ptr2 = CreateFoo();  // ptr2 owns the return Foo.
    scoped_ptr<Foo> ptr3 =        // ptr3 now owns what was in ptr2.
        PassThru(ptr2.Pass());    // ptr2 is correspondingly NULL.
}
{% endhighlight %}


* Notice that if you do not call Pass() when returning from PassThru(), or when invoking TakesOwnership(), the code will not compile because scopers are not copyable; they only implement move semantics which require calling the Pass() function to signify a destructive transfer of state.

* CreateFoo() is different though because we are constructing a temporary on the return line and thus can avoid needing to call Pass().

## Upcast
Pass() properly handles upcast in assignment.

{% highlight c++ %}
// you can assign scoped_ptr<Child> to scoped_ptr<Parent>:
scoped_ptr<Foo> foo(new Foo());
scoped_ptr<FooParent> parent = foo.Pass();
{% endhighlight %}

{% highlight c++ %}
// PassAs<>()
// should be used to upcast return value in return statement:
scoped_ptr<Foo> CreateFoo()
{
    scoped_ptr<FooChild> result(new FooChild());
    return result.PassAs<Foo>();
}
{% endhighlight %}













