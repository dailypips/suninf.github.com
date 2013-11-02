---
layout: article
title: Chrome - Bind / Callback
category: chrome
---
This article introduce the usage of base::Bind and base::Callback.
* The templated Callback class is a generalized function object. Together with the Bind() function in bind.h, they provide a type-safe method for performing `partial application of functions`.
* The Callback objects themselves should be passed by const-reference, and stored by copy. They internally store their state via a refcounted class and thus do not need to be deleted. The reason to pass via a const-reference is to avoid unnecessary AddRef/Release pairs to the internal state.

##Bind

###Binding a bare function
{% highlight c++ %}
int Return5() { return 5; }
base::Callback<int(void)> func_cb = base::Bind(&Return5);
func_cb.Run();
{% endhighlight %}

###Binding a member function
The first argument to bind is the member function to call, the second is the object on which to call it.

{% highlight c++ %}
class Ref : public base::RefCountedThreadSafe<Ref> {
public:
    int Foo() { return 3; }
    void PrintBye() { LOG(INFO) << "bye."; }
};
{% endhighlight %}


