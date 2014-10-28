---
layout: article
title: Bind and Callback in chrome
category: chrome
description: Class base::Bind and base::Callback in chrome are just like bind/function in boost, which are used to bind and store functions.
---
*Class **base::Bind** and **base::Callback** in chrome are just like bind/function in boost, which are used to bind and store functions.*

- The template Callback class is a generalized function object. Together with the Bind() function in bind.h, they provide a type-safe method for performing **partial application of functions**.
- The Callback objects themselves should be passed by const-reference, and stored by copy. They internally store their state via a refcounted class and thus do not need to be deleted. The reason to pass via a const-reference is to avoid unnecessary AddRef/Release pairs to the internal state.


## Binding a `bare function`

{% highlight c++ %}
int Return5() { return 5; }
base::Callback<int(void)> func_cb = base::Bind(&Return5);
func_cb.Run();
{% endhighlight %}


## Binding a `member function`

The first argument to bind is the member function to call, the second is the object on which to call it.

{% highlight c++ %}
class Ref : public base::RefCountedThreadSafe<Ref> {
public:
    int Foo() { return 3; }
    void PrintBye() { LOG(INFO) << "bye."; }
};
{% endhighlight %}

- **By default** the object must support `RefCounted` or you will get a compiler error. If you're passing between threads, be sure it's RefCountedThreadSafe!
- Also there are some ways below if you don't want to use reference counting.


## Passing parameters and run

- Callbacks can be run with their "Run" method, which has the same signature as the template argument to the callback. Unbound parameters are specified at the time a callback is Run(). They are specified in the Callback template type.
- Callbacks can be run **more than once** (they don't get deleted or marked when run). However, this precludes using base::Passed.
- Bound parameters are specified when you create the callback as arguments to Bind(). They will be passed to the function and the Run() of the callback doesn't see those values or even know that the function it's calling.
- A callback with no unbound input parameters (base::Callback&lt;void(void)>) is called a `base::Closure`.

{% highlight c++ %}
// unbound parameters
void MyFunc(int i, const std::string& str) {}
base::Callback<void(int, const std::string&)> cb = base::Bind(&MyFunc);
cb.Run(23, "hello, world");

// Closure
void MyFunc(int i, const std::string& str) {}
base::Closure cb = base::Bind(&MyFunc, 23, "hello world");
cb.Run();
{% endhighlight %}


## Advanced binding usage

- **base::Unretained** : binding a class method with manual management
{% highlight c++ %}
base::Bind(&MyClass::Foo, base::Unretained(this));
{% endhighlight %}
This disables all lifetime management on the object. You're responsible for making sure the object is alive at the time of the call. You break it, you own it!

- **base::Owned** :  binding a class method and having the callback own the class
{% highlight c++ %}
MyClass* myclass = new MyClass;
base::Bind(&MyClass::Foo, base::Owned(myclass));
{% endhighlight %}

The object will be deleted when the callback is destroyed, even if it's not run (like if you post a task during shutdown). Potentially useful for "fire and forget" cases.

- **base::IgnoreResult** : ignore return values
{% highlight c++ %}
int DoSomething(int arg) { cout << arg << endl; }
base::Callback<void<int>) cb =
   base::Bind(base::IgnoreResult(&DoSomething));
{% endhighlight %}

- **base::Passed** : passing ownership of scope_ptr to the callback

Ownership of the parameter will be with the callback until the it is run, when ownership is **passed to the callback function**. This means the callback can only be run once. If the callback is never run, it will delete the object when it's destroyed.
{% highlight c++ %}
void TakesOwnership(scoped_ptr<Foo> arg) {}
scoped_ptr<Foo> f(new Foo);
// f becomes null during the following call.
base::Closure cb = base::Bind(&TakesOwnership, base::Passed(&f));
{% endhighlight %}

- passing parameters as a **scoped_refptr**
{% highlight c++ %}
void TakesOneRef(scoped_refptr<Foo> arg) {}
scoped_refptr<Foo> f(new Foo)
base::Closure cb = base::Bind(&TakesOneRef, f);
{% endhighlight %}
The closure will take a reference as long as it is alive, and another reference will be taken for the called function.

- **base::ConstRef**
{% highlight c++ %}
void foo(int arg) { cout << arg << endl }
int n = 1;
base::Closure has_ref = base::Bind(&foo, base::ConstRef(n));
n = 2;
has_ref.Run();  // Prints "2"
{% endhighlight %}
Normally parameters are copied in the closure. **DANGER**: ConstRef stores a const reference instead, referencing the original parameter. This means that you must ensure the object outlives the callback!

- **GetWeakPtr**
{% highlight c++ %}
base::Bind(&MyClass::Foo, GetWeakPtr());
{% endhighlight %}
The callback will not be issued if the object is destroyed at the time it's issued. **DANGER**: weak pointers are not threadsafe, so don't use this when passing between threads!