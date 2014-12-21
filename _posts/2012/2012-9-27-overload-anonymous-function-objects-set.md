---
layout: article
title: 重载匿名函数对象集
category: c++
---
C++11支持lambda，匿名函数可以随处方便的书写，但是支持多种调用方式的匿名函数却不能直接支持。

## 重载匿名函数
可以借助于以下的overload_set方法实现：

* 继承自匿名函数对象类型；
* 通过using F::operator()声明访问匿名函数类型的成员函数

{% highlight c++ %}
#include<string>
#include<iostream>
 
template<typename F1, typename F2>
struct overload_set : F1, F2
{
    overload_set( F1 x1, F2 x2 ) : F1(x1), F2(x2) {}
 
    using F1::operator();
    using F2::operator();
};
 
template <class F1, class F2>
overload_set<F1,F2> overload(F1 x1, F2 x2)
{
    return overload_set<F1,F2>(x1, x2);
}
 
// 命名函数对象
struct funcobj
{
    int operator() (int x) const
    {
        return 2*x;
    }
 
    std::string operator() (std::string const& s1, std::string const& s2) const
    {
        return s1+s2;
    }
};
 
int main()
{
    // 命名多功能函数对象
    std::cout << funcobj()(5) << std::endl;
    std::cout << funcobj()("sun", "inf") << std::endl;
 
    // 匿名函数集重载
    auto f = overload(
        [](int x) { return 2*x; },
        [](std::string const& s1, std::string const& s2) {return s1+s2;}
        );
 
    std::cout << f(5) << std::endl;
    std::cout << f("sun", "inf") << std::endl;
 
    return 0;
}
{% endhighlight %}

输出：  
10  
suninf  
10  
suninf  
 
 
## 函数对象作为C++一级对象（first-class objects）
与普通模板函数不同，函数对象可以作为函数的参数与返回值。

{% highlight c++ %}
#include<algorithm>
#include<iostream>
 
struct mul_t
{
    template<typename T>
    T operator() (T x, T y) const { return x*y; }
} mul_ = {};
 
int main()
{
    int c[] = {1,2,3,4,5};
    std::cout << std::accumulate( std::begin(c), std::end(c), 1, mul_ )
        << std::endl;
 
    return 0;
}
{% endhighlight %}