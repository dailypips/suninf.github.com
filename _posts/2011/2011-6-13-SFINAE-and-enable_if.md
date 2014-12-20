---
layout: article
title: SFINAE与enable_if的使用
category: c++
---
*C++中“类型敏感的”模板函数重载依赖于**SFINAE**(substitution-failure-is-not-an-error，替换失败不是错误)。*

## SFINAE原则
* 在**函数模板的实例化**过程中，如果**推断形成的某个参数或返回值类型无效**，那么这个实例将从重载决议集中去掉而不是引发一个编译错误
* 而`boost::enable_if`使得SFINAE原则成为一个惯用法。

例如：
{% highlight c++ %}
int negate(int i) { return -i; }

template <class F>
typename F::result_type negate(const F& f) { return -f(); }
{% endhighlight %}

假设编译器遇到了`negate(1)`的调用。很明显第一个定义是个好选择，但是编译器必须在检查所有的定义后才能作出决定，这个检查过程包含对模板的实例化。使用 int 作为类型 F 对第二个定义进行实例化将产生：  

`int::result_type negate(const int&);`  

这里的返回值类型是无效的。 如果把这种情况看作是一种错误，那么添加一个无关的函数模板（从来不会被调用）也将导致原本有效的代码无法通过编译。由于 SFINAE 原则的存在，上面的例子不会产生编译错误，在这种情况下编译器会简单地从重载决议集中抛弃后一个 negate 的定义。 


## SFINAE的应用例子
SFINAE常常与sizeof配合使用来创建识别类型特征的traits模板类。

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
auto check_member_foo(T const& t, decltype(&T::foo) p = 0)->decltype(p);

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
    //int foo;
};

int main()
{
    cout << has_member_fun_or_property<test>::value << endl;
    cout << has_member_fun_or_property<test2>::value << endl;
    
    return 0;
}
{% endhighlight %}

 
## enable_if
使用 enable_if 系列模板可以控制一个函数模板或类模板偏特化是否包含在基于模板参数属性的一系列匹配函数或偏特化中。

### enable_if系列模板
{% highlight c++ %}
namespace boost {
  template <class Cond, class T = void> struct enable_if;
  template <class Cond, class T = void> struct disable_if;
  template <class Cond, class T> struct lazy_enable_if;
  template <class Cond, class T> struct lazy_disable_if;

  template <bool B, class T = void> struct enable_if_c;
  template <bool B, class T = void> struct disable_if_c;
  template <bool B, class T> struct lazy_enable_if_c;
  template <bool B, class T> struct lazy_disable_if_c;
}
{% endhighlight %}


### 函数模板，存在两种方法：
* **返回值类型**使用`enable_if<Cond, T>::type`来指定，Cond则是检测当前函数模板参数的谓词模板（具有静态的value常量值）。这样函数重载实例化的时候会计算返回值类型，如果Cond对应value值为false，则从重载协议列表中删除。

{% highlight c++ %}
template <class T>
typename boost::enable_if<boost::is_arithmetic<T>, T >::type
foo(T t);// 限制T为算术类型
{% endhighlight %}
 
* **增加一个额外的函数参数来协助**，比如
{% highlight c++ %}
string foo(string);
 
template <class T>
T foo(T t, typename enable_if<is_arithmetic<T> >::type* dummy = 0);
{% endhighlight %}

仅对于算术类型会选择第二个函数重载，而dummy默认参数不真正使用
 
注意事项：  

1. 大部分情况下，还是选择指定返回类型的方式比较好，因为指定默认函数参数，引起接口函数的参数数量的变更。
2. 运算符重载的参数个数是固定的，所以 enable_if 只能用作返回值。
3. 构造函数和析构函数没有返回值，所以只能添加一个额外的参数。


### 对于类模板，决策模板偏特化
类模板偏特化可以使用 enable_if 来控制其启用与禁用。为达到这个目的，需要为模板添加一个额外的模板参数用于控制启用与禁用。这个参数的默认值是 void。比如：
 
{% highlight c++ %}
template <class T, class Enable = void>
class A { ... };
 
template <class T>
class A<T, typename enable_if<is_integral<T> >::type> { ... };
{% endhighlight %}
 
例如：
{% highlight c++ %}
#include <iostream>
#include <string>
using namespace std;
 
#include <boost/utility.hpp>
#include <boost/type_traits.hpp>
using namespace boost;
 
template <class T, class Enable = void>
class A
{
public:
    static void pt() { cout << "default" << endl; }
};
 
template <class T>
class A<T, typename enable_if<is_integral<T> >::type>
{
public:
    static void pt() { cout << "integral" << endl; }
};
int main()
{
    A<string>::pt();
    A<int>::pt();
    return 0;
}

//输出：
default
integral
{% endhighlight %}

关于lazy版本的注意点：
lazy_enable_if 的第二个参数必须是一个在第一个参数（条件）为 true 时定义了一个名字为 type 的的内嵌类型。


### enable_if 的源码参考（取自boost，非常精炼的代码）：
{% highlight c++ %}
namespace boost
{
 
  template <bool B, class T = void>
  struct enable_if_c {
    // 定义嵌套的可选的T为type
    typedef T type;
  };
 
  // 特化false，bool型值取用时无法获取type
  template <class T>
  struct enable_if_c<false, T> {};

 
  // Cond是内嵌value常量的类型，特别适合配合type_traits库来使用。
  template <class Cond, class T = void>
  struct enable_if : public enable_if_c<Cond::value, T> {};
 
  // Lazy情况下，第二个模板参数必须使用，并且要求其具有嵌套的type类型，
  // 否则就算为true也无效。
  template <bool B, class T>
  struct lazy_enable_if_c {
    typedef typename T::type type;
  };
 
  template <class T>
  struct lazy_enable_if_c<false, T> {};
 
  template <class Cond, class T>
  struct lazy_enable_if : public lazy_enable_if_c<Cond::value, T> {};
 
  // 以下disable版本只是默认false时，能取到对应的结果
  template <bool B, class T = void>
  struct disable_if_c {
    typedef T type;
  };
 
  template <class T>
  struct disable_if_c<true, T> {};
 
  template <class Cond, class T = void>
  struct disable_if : public disable_if_c<Cond::value, T> {};
 
  template <bool B, class T>
  struct lazy_disable_if_c {
    typedef typename T::type type;
  };
 
  template <class T>
  struct lazy_disable_if_c<true, T> {};
 
  template <class Cond, class T>
  struct lazy_disable_if : public lazy_disable_if_c<Cond::value, T> {};
 
} // namespace boost
{% endhighlight %}

