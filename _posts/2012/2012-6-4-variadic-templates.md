---
layout: article
title: C++0x 变长模板参数
category: c++
---
*本质上，变长模板参数（Variadic Templates）也是一种**函数式编程中常用的列表模式匹配**。*

## 变长模板参数
变长模板参数是对原有C++模板的轻量级的扩展，增加了对…省略号的支持，即：

* 如果模板参数带…，那么该模板参数**可以匹配0个或多个实参**；
* 对于类模板特化，扩展了针对…省略号的实例化的**优先匹配规则**：
    1. 非变长模板参数的特化比变长模板参数的特化优先匹配；
    2. 两个变长模板参数的特化，模板参数包将覆盖的（cover）参数少的优先匹配。
* 对于**函数模板重载**：
    1. 非变长函数比变长函数优先匹配
    2. 对于两个变长函数模板，变长参数包将覆盖的实参少的优先匹配。
 
### **注**：

1. 在变长类模板的特化以及变长函数模板的重载中，变长参数包都有类似的优先选择语法，即变长参数包将覆盖的元素少的能优先匹配，这是函数式编程中实现列表的模式匹配的关键。
2. 参数包是编译期的概念，在运行时的C++类型系统中不存在，即：模板参数包不是类型，函数参数包也不是值。
 
 
## 基本语法：
{% highlight c++ %}
template< typename... Ts >
class C
{
    //...
};
 
template< typename... Ts >
void fun( Ts const&... vs )
{
    //...
}
{% endhighlight %}

新的编译期语法：参数包（Parameter Packs）

* Ts不是一个类型，vs不是一个值。
* 在编译期，Ts是一列类型的别名；vs是一列值的别名
* 类型列表Ts或者函数实参列表vs都可能为空
* 声明是…都在别名的前面，而扩展使用参数包时，…用在后面
 
 
## 使用参数包：
1、计算长度：  
size_t items = sizeof ...(Ts); // or vs
 
2、参数包展开规则：  

|---
| 使用 | 扩展 
|-|:-|:-:|-:
| `Ts…` | `T1, …, Tn` 
| `Ts&&…` |`T1&&, …, Tn&&…` 
| `X<Ts, Y>::z…` |`X<T1, Y>::z, …, X<Tn, Y>::z` 
| `X<Ts&, Us>…` | `X<T1&,U1>, …, X<Tn&,Un>`
| `Func( 5, vs )…`  | `Func(5, v1), …, Func( 5, vn )`


3、基于展开规则的使用的一些例子  

* 初始化列表  
`any a[] = { vs…- };`
 
* 用于继承列表
{% highlight c++ %}
template< typename... Ts >
struct C : Ts...
{
    // ...
};
 
template< typename... Ts >
struct D : Box<Ts>...
{
    //...
};
 
// D的构造函数
template<typename... Us>
D( Us... vs ) : Box<Ts>(vs)...
{}
{% endhighlight %}

 
## lambda捕获列表
{% highlight c++ %}
template< typename... Ts >
void func( Ts... vs )
{
    auto g = [&vs...] { return gun(vs...); }
    g();
}
{% endhighlight %}
 
 
## 多重展开
{% highlight c++ %}
template< typename... Ts >
void func( Ts... vs )
{
    // A<T1,…,Tn>::hun(v1), …, A<T1,…,Tn>::hun(vn)
    gun( A<Ts...>::hun(vs)... );
 
    // A<T1,…,Tn>::hun(v1, …, vn)
    gun( A<Ts...>::hun(vs...) );
 
    // A<T1>::hun(v1), …, A<Tn>::hun(vn)
    gun( A<Ts>::hun(vs)... );
}
{% endhighlight %}


## 模板的模板参数也支持参数包
{% highlight c++ %}
template
< 
    typename T,
    template< template<typename...> class... Policies >
> 
class VVTTs
{
    // ...
};
{% endhighlight %}
模板类型VVTTs可以接受多个模板的模板参数。
 
 
## 变长类模板
对于变长类模板，获取变长模板参数包的每个参数是通过递归实例化来方式来实现的，类似于函数式编程中的列表模式匹配，变长模板的特化`<typename head, typename tail…>`的模式 来实现。
 
* 计算一串类型的长度:  
{% highlight c++ %}
#include <iostream>
using namespace std;
 
template<typename... list>
struct count;
 
template<>
struct count<>
{
    static const int value = 0;
};
 
template<typename head, typename... tail>
struct count<head, tail...>
{
    static const int value = 1 + count<tail...>::value;
};
 
int main()
{
    cout << count<int, double, int>::value << endl;
    return 0;
}
{% endhighlight %}

输出：3
 
 
## 变长函数模板
* 变长函数模板可以用任意数量的参数来调用，变长函数模板的最后一个参数使用模板参数包的形式（也需要省略号…）。
* 获取变长函数模板的函数参数包，是通过模板函数的列表模式匹配重载来实现的。
 
### 例1：make_tuple
{% highlight c++ %}
template<typename Elements...>
tuple<Elements...> make_tuple( Elements const&... elems )
{
    return tuple<Elements...>( elems... );
}
{% endhighlight %}

变长函数模板的语法是模式的概念，`Elements const&...`将应用于变长函数模板的每个参数类型，而`elems...`将扩展为类`tuple<Elements...>`的构造函数的参数。
 
 
### 例2：打印任意参数
{% highlight c++ %}
#include <iostream>
using namespace std;
 
void print() {}
 
template< typename Head, typename... Tail >
void print( Head const& head, Tail const&... tail )
{
    cout << head << endl;
    print( tail... );
}
 
int main()
{
    print( 1, "hello world", 3.14 );
    return 0;
}
{% endhighlight %}

输出：  
1  
hello world  
3.14  
 
 
### 例3：isOneOf函数
{% highlight c++ %}
#include <iostream>
#include <assert.h>
using namespace std;
 
template<typename T1, typename T2>
bool isOneOf( T1&& a, T2&& b )
{
    return a==b;
}
 
template<typename T1, typename T2, typename... Ts>
bool isOneOf( T1&& a, T2&& b, Ts&&... vs )
{// 模式匹配：内部递归调用了isOneOf，其实是参数的模式匹配，
 // 是函数重载，而不是递归
    return a==b || isOneOf( a, vs... );
}
 
int main()
{
    assert( isOneOf(1, 2, 3.5, 1) );
    return 0;
}
{% endhighlight %}
