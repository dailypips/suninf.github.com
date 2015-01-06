---
layout: article
title: function_types in boost
category: boost
---
**boost::function_types**提供了对**函数签名、函数指针、函数引用和成员指针等类型进行分类、分解和合成的功能**。而这些类型统称为可调用内建类型（callable builtin types）。

* 该库提供了一系列针对可调用内建类型的traits；
* 另外使用了tag 类型来对不属于类型本身的属性进行编码，如调用协定或函数是否为变长参数或 cv限定（const、volatile）。
 
 
## tag标签的说明
头文件：`#include <boost/function_types/property_tags.hpp>`
 
tag类型：
{% highlight c++ %}
template<class Tag1, class Tag2, class Tag3 = null_tag, class Tag4 = null_tag>
struct tag;
{% endhighlight %}

* tag可以用于说明可调用内建类型的属性
{% highlight c++ %}
#include <iostream>
using namespace std;
 
#include <boost/function_types/property_tags.hpp>
#include <boost/function_types/is_function.hpp>
 
namespace func_types = boost::function_types;
 
int main()
{
    cout << 
    func_types::is_function<int(int,...), func_types::variadic>::value 
    << endl; // 输出为1
   
    return 0;
}
{% endhighlight %}

 
* 复合的属性 tag 描述了不同属性的可能值的组合。
    1. 类型 `components<F>`, 其中 F 为可调用内建类型，是描述 F 的复合属性 tag。类模板 tag 可用于合成属性 tags。如：`tag<non_const,default_cc> // 两个属性的组合`
    2. 当同一个属性的多个值在 tag 的参数列表中被指定时，只使用最右边的一个；其它值会被忽略。`tag<components<F>, default_cc> // 覆盖 F 的调用协定属性`
 
* 当复合属性 tag 被指定为分析一个类型，它的所有组成属性都必须匹配。
{% highlight c++ %}
is_member_function_pointer<F, tag<const_qualified,default_cc>>::value
// true for
//   F = void(a_class::*)() const
 
// false for
//   F = void(a_class::*)()                     // 非const
//   F = void(__fastcall a_class::*)() const    // 非默认调用协stdcall
{% endhighlight %}

## 各个tag标识：
variadic  
表示函数类型通过一个省略号参数接受变长数量的参数(例如 printf)。  
 
non_variadic  
表示函数类型不带省略号参数。  
 
default_cc  
表示函数类型按缺省的调用协定进行编码。  
 
const_qualified  
表示函数类型是 const 限定的。  
 
non_const  
表示函数类型不是 const 限定的。  
 
volatile_qualified  
表示函数类型是 volatile 限定的。  
 
non_volatile  
表示函数类型不是 volatile 限定的。  
 
non_cv  
表示函数类型既不是 const 限定也不是 volatile 限定的。  
等价于 `tag<non_const,non_volatile>`, 不过在求值时执行更少的模板实例化。  
 
const_non_volatile  
表示函数类型是 const 限定但非 volatile 限定的。  
 
volatile_non_const  
表示函数类型是 volatile 限定但非 const 限定的。  
 
cv_qualfied  
表示函数类型同时是 const 和 volatile 限定的。  
等价于`tag<const_qualified,volatile_qualified>`, 不过在求值时执行更少的模板实例化。  
 
null_tag  
表示没有标签。  
 
 
## 分析、构造可调用内建类型的traits
每个traits类型都有个与类型名同名的头文件。

### 用于类型分类的类模板

* is_function  
{% highlight c++ %}
template<typename T, typename Tag = null_tag>
struct is_function;
{% endhighlight %}
`is_function<T,Tag>::value` 为 bool类型值  
判定一个给定的类型是否为函数，可以通过属性标签额外指定属性。  
 
* is_function_pointer  
判定一个给定的类型是否为函数指针。  
 
* is_function_reference  
判定一个给定的类型是否为函数引用。  
 
* is_member_pointer  
判定一个给定的类型是否为成员(对象或函数)指针类型。  
 
* is_member_object_pointer  
判定一个给定的类型是否为成员对象指针类型。  
 
* is_member_function_pointer  
判定一个给定的类型是否为成员函数指针。  
 
* is_callable_builtin  
判定一个给定的类型是否为可调用内建类型。  
 
* is_nonmember_callable_builtin  
判定一个给定的类型是否为非成员函数指针的可调用内建类型。  
 
 
### 用于类型分解的类模板

* result_type
{% highlight c++ %}
template<typename F>
struct result_type;
// result_type<F>::type 为 F的结果类型
{% endhighlight %}
 
* parameter_types
{% highlight c++ %}
template<typename F, class ClassTransform = add_reference<_> >
struct parameter_types;
// 取出一个可调用内建类型的参数类型。function_arity<F>::type得到类型序列：mpl::vector<>   
{% endhighlight %}

{% highlight c++ %}
#include <iostream>
#include <typeinfo>
using namespace std;
 
#include <boost/function_types/property_tags.hpp>
#include <boost/function_types/parameter_types.hpp>
#include <boost/type_traits.hpp>
 
namespace func_types = boost::function_types;
 
typedef int (*func)( int, string );
 
class Test {};
 
int main()
{
    // mpl::vector2<int, string>
    cout << typeid( func_types::parameter_types<func>::type ).name() << endl;
    
    // mpl::vector2<Test&, int>
    cout << typeid( func_types::parameter_types< void (Test::*) ( int ) >::type ).name() << endl;
 
    // mpl::vector2<Test const&, double>
    cout << typeid( func_types::parameter_types< void (Test::*) ( double ), boost::add_reference< boost::add_const< boost::mpl::_ > > >::type ).name() << endl;
    return 0;
}
{% endhighlight %}

* function_arity
{% highlight c++ %}
template<typename F>
struct function_arity;
{% endhighlight %}
取出函数的参数数量。成员函数指针的隐藏 this 参数也计算在内，换言之，如果 F 为成员函数指针，则它的参数数量肯定大于等于一。
 
* components
{% highlight c++ %}
template<typename T, class ClassTransform = add_reference<_> >
struct components;
{% endhighlight %}
取出一个可调用内建类型的所有属性，即结果类型及参数类型(对于成员函数指针还包括 this 的类型)。  
`components<T,ClassTransform>::types` 输出对应的序列`mpl::vector<>`  
 
{% highlight c++ %}
#include <iostream>
#include <typeinfo>
using namespace std;
 
#include <boost/function_types/property_tags.hpp>
#include <boost/function_types/components.hpp>
#include <boost/type_traits.hpp>
 
namespace func_types = boost::function_types;
 
typedef int (*func)( int, string );
 
class Test {};
 
int main()
{
    // mpl::vector3<int,int,string>
    cout << typeid( func_types::components<func>::types ).name() << endl;
 
    // mpl::vector3<void,Test const&,double>
    cout << typeid( func_types::components< void (Test::*) ( double ), boost::add_reference< boost::add_const< boost::mpl::_ > > >::types ).name() << endl;
    return 0;
}
{% endhighlight %}

### 用于类型合成的类模板

* function_type
{% highlight c++ %}
template<typename Types, typename Tag = null_tag>
struct function_type;
// Types：用于组装的类型，格式为 MPL前向序列 或 其它可调用内建类型
{% endhighlight %}

* function_pointer
{% highlight c++ %}
template<typename Types, typename Tag = null_tag>
struct function_pointer;
// 根据给定的属性合成一个函数指针。
{% endhighlight %}

* function_reference
{% highlight c++ %}
template<typename Types, typename Tag = null_tag>
struct function_reference;
// 根据给定的属性合成一个函数引用。
{% endhighlight %}

* member_function_pointer
{% highlight c++ %}
template<typename Types, typename Tag = null_tag>
struct member_function_pointer;
{% endhighlight %}
根据给定的属性合成一个成员函数指针。  
序列中的第二个类型如果带有引用或 cv-限定的指针，则会被去除，以确定类的类型。结果类型的 cv-限定被应用于成员函数，除非另外通过属性标签进行显式指定。  

## 例子：
{% highlight c++ %}
#include <iostream>
#include <typeinfo>
using namespace std;
 
#include <boost/function_types/property_tags.hpp>
#include <boost/function_types/function_type.hpp>
#include <boost/function_types/function_pointer.hpp>
#include <boost/function_types/function_reference.hpp>
#include <boost/function_types/member_function_pointer.hpp>
#include <boost/mpl/vector.hpp>
 
namespace func_types = boost::function_types;
 
typedef int (*func)( int, string );
class Test{};
 
int main()
{
    //从mpl::vector<>序列或其他可调用内建类型得到 函数签名
    cout << typeid( func_types::function_type< boost::mpl::vector<int,string,double> >::type ).name() << endl;
    cout << typeid( func_types::function_type< int (Test::*)(double) >::type ).name() << endl;
   
    //从已有的函数指针类型得到对应的函数类型
    cout << typeid( func_types::function_pointer< func >::type ).name() << endl;
    cout << typeid( func_types::function_reference< func >::type ).name() << endl;
 
    // 得到成员函数指针（ 类型复制 或者 mpl序列 ）
    cout << typeid( func_types::member_function_pointer< int (Test::*)(double)const >::type ).name() << endl;
 
    // 显式加上const
    cout << typeid( func_types::member_function_pointer< boost::mpl::vector<int,Test,double>, func_types::const_qualified >::type ).name() << endl;
 
    // const保留到了成员函数
    cout << typeid( func_types::member_function_pointer< boost::mpl::vector<int,Test const&,double> >::type ).name() << endl;
 
 
    return 0;
}

// 输出：
// int __cdecl(string,double)
// int __cdecl(class Test &,double)
// int (__cdecl*)(int,string)
// int __cdecl(int,string)
// int (__thiscall Test::*)(double)const
// int (__thiscall Test::*)(double)const
// int (__thiscall Test::*)(double)const
{% endhighlight %}