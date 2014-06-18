---
layout: article
title: SFINAE与sizeof的使用
category: c++
description: C++中“类型敏感的”模板函数重载依赖于SFINAE(substitution-failure-is-not-an-error，替换失败不是错误)，原则：在函数模板的实例化过程中，如果形成的某个参数或返回值类型无效那么这个实例将从重载决议集中去掉而不是引发一个编译错误。而boost::enable_if使得SFINAE原则成为一个惯用法。
---
*C++中“类型敏感的”模板函数重载依赖于**SFINAE**(substitution-failure-is-not-an-error，替换失败不是错误)。*

## SFINAE原则
* 在**函数模板的实例化**过程中，如果**推断形成的某个参数或返回值类型无效**，那么这个实例将从重载决议集中去掉而不是引发一个编译错误
* 而`boost::enable_if`使得SFINAE原则成为一个惯用法。*
 
 
## SFINAE的应用例子

### 判断一个类型是否可调用
{% highlight c++ %}
template<typename Fun, typename A, typename B>
struct can_be_called; // Fun是否可以接受A,B两个参数的调用
{% endhighlight %}

{% highlight c++ %}
// 实现
#include <iostream>
#include <string>
#include <boost/mpl/bool.hpp>
using namespace std;
using namespace boost;
// 接受任意参数，保证最佳匹配外，能编译通过
struct dont_care
{
    dont_care(...);
};
 
// 封装一个类型，重载逗号运算符，接受一个int
struct private_type
{
    private_type const& operator,(int) const;
};
 
// 用于SFINAE测试的类型及函数
typedef char yes_type;      // sizeof(yes_type) == 1
typedef char (&no_type)[2]; // sizeof(no_type) == 2
 
// 编译期‘试’调用，判断返回值，来判定选择了那个函数，来做决策
template<typename T>
no_type is_private_type(T const &);
 
yes_type is_private_type(private_type const &);
 
// 一个函数封装器
template<typename Fun>
struct funwrap2 : Fun
{
    funwrap2();
    
    typedef 
      private_type const &(*pointer_to_function)(dont_care, dont_care);
    
    // 转型为二元任意参数的函数指针，来保证编译通过
    operator pointer_to_function() const; 
};
 
// 实现can_be_called
template< typename Fun, typename A, typename B >
struct can_be_called
{
    static funwrap2<Fun>& fun;
    static A& a;
    static B& b;
 
    static const bool value =
       sizeof(no_type) == sizeof( is_private_type( (fun(a,b),0) ) );
 
    typedef mpl::bool_<value> type;
};
 
 
struct funTest
{
    void operator() ( int, string ) {}
};
 
struct funTest2
{
    void operator() ( string, int, double ) {}
};
 
int main()
{
    cout << "can be called: " <<
       (can_be_called< funTest, int, string >::type::value ? 
            "yes" : "no" ) 
       << endl;
   
    cout << "can be called: " <<
       (can_be_called< funTest2, int, string >::type::value ? 
            "yes" : "no" ) 
       << endl;
    return 0;
}
 
// 输出：
can be called: yes
can be called: no
{% endhighlight %}


### 检测一个类型是否具有给定名字的typedef
这个功能其实boost已经实现：包含`#include<boost/mpl/has_xxx.hpp>`
使用：  

* `BOOST_MPL_HAS_XXX_TRAIT_DEF( type );`
* 则我们可以使用has_type<T>::value来判断是否T类型是否具有typedef的type类型。
 
{% highlight c++ %}
// 一个简单的实现：
#include <iostream>
using namespace std;
 
template<typename T>
struct helper
{
    typedef void type;
};
 
template<typename T, typename U = void> // 用默认模板参数指示默认情况
struct has_def_type_impl
{
    static const bool value = false;
};
 
template<typename T> //偏特化，优先去适配从T萃取类型， T有内置的type时选择
struct has_def_type_impl<T, typename helper<typename T::type>::type >
{
    static const bool value = true;
};
 
template<typename T>
struct has_def_type : has_def_type_impl<T>
{
}; // 检测类型T是否具有内部的名为type的typedef
 
// test
struct test
{
    typedef int type;
};
 
struct test2
{
};
 
int main()
{
    cout << has_def_type<test>::value << endl;
    cout << has_def_type<test2>::value << endl;
 
    return 0;
}

// 输出：
1
0
{% endhighlight %}

注意：关键是一个默认模板参数，一个是借助T萃取类型的模板偏特化，编译器先去尝试从T类型萃取类型，进行偏特化，如果T具有对应的type，则偏特化成功，优先选择偏特化；若T没有对应的type，则萃取失败，但SFINAE（替换失败不是错误原则），会选择默认的模板，则value为false。
 
 
### 检测一个类型中含有成员名
借助于decltype可以通用的检查成员对象和成员函数的名字

{% highlight c++ %}
#include <iostream>
using namespace std;
 
// foo 可以是成员函数或者成员对象
char check_member_foo(...);
 
template <typename T>
auto check_member_foo(T const& t, decltype(&(t.foo)) p = 0)->decltype(p);
 
template<typename T>
struct has_member_fun_or_property
{
    static const bool value =
       sizeof(char) != sizeof( check_member_foo( *static_cast<T*>(0) ) );
};
 
struct test
{
    void foo(int, double);
};
 
struct test2
{
    int foo;
};
 
int main()
{
    cout << has_member_fun_or_property<test>::value << endl;
    cout << has_member_fun_or_property<test2>::value << endl;
 
    return 0;
}
{% endhighlight %}
 
### 实现一个has_member_的结构 `has_member_fun<T>::value`
检查一个类型是否有指定签名的成员函数

{% highlight c++ %}
#include <iostream>
using namespace std;
 
// 要求T具有成员函数 void fun(int,double)
template<typename T>
struct has_member_fun
{
    typedef char yes;    // sizeof(yes) == 1
    typedef char(&no)[2] ;   // sizeof(no) == 2
 
    static yes helper( void (T::*)( int, double ) );
    static no helper(...);
 
    static const bool value =
       sizeof(yes) == sizeof( helper( &T::fun ) );
};
 
struct test
{
    void fun(int, double);
};
 
struct test2
{
    void fun(int, int);
    void fun2(int, double);
};
 
int main()
{
    cout << has_member_fun<test>::value << endl;
    cout << has_member_fun<test2>::value << endl;
 
    return 0;
}

// 输出：
1
0
{% endhighlight %}
 


