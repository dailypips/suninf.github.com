---
layout: article
title: lambda函数与递归
category: other
description: lambda函数是匿名的，但是如果需要实现递归，那么必须要绑定名字，但是我们又不想因此而麻烦去定义函数。
---
*C++模板在编译期的行为与纯函数式编程有很多相似之处。通过观察函数式编程，并使用C++模板与之类比，来深入分析C++模板作为C++编译期的函数式编程的基础设施，掌握C++模板的本质及其灵活应用。*

### Erlang
Erlang是强动态类型的函数式语言，没有变量的概念，或者说只支持一次赋值，以后不能改变。正是因为没有变量，保证了函数不会有副作用，相同的输入必定得到相同的输出。
 
{% highlight erlang %}
%%  Erlang赋值及函数
A = 5.
A = 6.       % error A不能再赋值了
 
Fun = fun(X) -> X*X end.
Fun( A );   % 返回25

 
### C++
/////////////////////////


*lambda函数是匿名的，但是如果需要实现递归，那么必须要绑定名字，但是我们又不想因此而麻烦去定义函数。*
 
## 关于绑定名字：

* 对于python这样的动态类型语言，可以直接将lambda函数赋值给变量；
* 对于C++这种强静态类型，可以使用函数存储器boost::function来存储；
* 对于Erlang这种纯函数式语言，我们无法实现这种递归的lambda函数。
 
### C++
{% highlight c++ %}
#include <iostream>
#include <boost/function.hpp>
 
int main()
{
    boost::function< int(int) > factorial =
       [&](int x) { return x==0 ? 1 : x * factorial(x-1); };
    std::cout << factorial(5) << std::endl;
 
    return 0;
}
{% endhighlight %}

输出：  
120
 
注：  
使用C++0x的lambda语法，注意绑定使用&来捕捉当前作用域，而不是lambda函数体作用域。
 
 
### python
{% highlight python %}
>>> factorial = lambda x : 1 if x==0 else x * factorial(x-1)
>>> factorial(5)
120
{% endhighlight %}


### javascript
{% highlight javascript %}
var factorial = function(x){
        return x==0 ? 1 : x * arguments.callee(x-1);
    };
factorial(5);   // 120
{% endhighlight %}


### Erlang
{% highlight erlang %}
factorial(0) -> 1;
factorial(X) -> X * factorial(X-1).
 
> factorial(5).
120
{% endhighlight %}

注：  
Erlang是纯函数式语言，函数体与外界作用域完全脱离，因此无法重用变量名字，递归只能通过模式匹配来显式定义函数。