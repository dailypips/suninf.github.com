---
layout: article
title: C++编译期惯用法
category: c++
description: 
---

*本文整理了C++的一些编译期的惯用法，主要是一些模板类与模板函数的应用，本文的模板技术分析从模板支持的语法基础、惯用法、模板元编程初步等来展开。*


泛型技术背景：

= 泛型：类模板，函数模板为多种类型设计。如：STL容器，算法
- 抽象：通过模板技术可以抽象成一般性，封装统一的方式。如：迭代器的规范化和iterator_traits的统一类型取用。
- 多态：模板实现的静态多态，比动态多态更高效。
 
 
## 语法基础

- 函数模板
- 类模板
- 模板参数说明
- 类的成员模板
- `template & typename` 消除模糊语义
 
### 函数模板

最核心的特征：

- 模板参数自动推断

{% highlight c++ %}
template<typename T>
void f(T);
//...
int n = 0;
f(&n); // T自动推断为int*
{% endhighlight %}

- 主函数模板参与重载决议（不要使用模板函数的特化）

**关于函数模板的重载决议**：普通函数和主函数模板能加入重载决议，模板函数特化不加入，并且普通函数是一等公民，优先被选择；否则，寻找主函数模板中最佳的匹配，在选择了某个主函数模板的前提下，其特化版本才可能被选择。
 
- 不要使用函数模板特化，要特化先考虑直接使用普通函数
- 如果需要针对函数模板实现特化的效果，可以加入一个间接层实现

{% highlight c++ %}
template<typename T>
void f() { f_impl<T>::f(); }
 
template<typename T>
struct f_impl
{
    static void f() { 
      //...
    }
};
{% endhighlight %}

然后针对f_impl偏特化即可。
 

### 类模板

- 偏特化（依赖的模板参数的数量减少）

{% highlight c++ %}
template<typename T, typename U>
struct Test{
  //...
};
 
template<typename T> struct Test<T, T> {
  //...
};
{% endhighlight %}

- 全特化

{% highlight c++ %}
template<>
struct Test<int,double> { 
  //...
};
{% endhighlight %}

- 类的成员函数模板和成员类模板

{% highlight c++ %}
template<typename T>
class Test
{
public:
  template<typename U>
  struct InnerHelper
  {// 可以使用外部类模板参数
    static void fun( U const& , T const& );
  };

  template<typename U>
  Test( U const& u ) : t_(u) {} // 隐式转换支持构造
private:
  T t_;
};
{% endhighlight %}

### 模板参数说明

- 类型，如：`typename/class T`

- 常量（整型，bool等），函数指针，成员函数指针

{% highlight c++ %}
struct Test  { void f(int); };
 
template< void (Test::*FunType)(int) >
void ff( Test t )  { (t .* FunType)(0); }
 
ff< &Test::f >( Test() );
{% endhighlight %}

- 模板的模板

`template< template<typename T> class U > struct TC;`
 
- 类模板参数可以指定默认值。
 
### typename消除歧义

{% highlight c++ %}
template<typename Iter>
struct iter_trait
{
  typedef typename Iter::type type;
};
{% endhighlight %}

Iter::type依赖于模板参数Iter，编译器会默认认为是值，而非类型，要使用typename告诉编译器依赖名 Iter::type是一个类型。
 
{% highlight c++ %}
struct Test
{
  template<int n>
  int convert( int m ) { return m-n; }
};
struct Test2
{
  Test2() : convert(3) {}
  int convert;
};
template<typename T>
void fun( T t )
{
  cout << ( t.convert < 3 > (5) ) << endl;
}
//...
fun( Test() );
fun( Test2() );
{% endhighlight %}

 
## Idioms 泛型惯用法

- traits
- tag dispatching
- int to type
- type to type
- adapter
- SRTP
- SFINAE
- enable_if
- policy class
- lazy evaluation
 
### traits

编译期类型计算和包装，方便编译期通过traits类获取类型（属性）等。
 
最简单的例子：

{% highlight c++ %}
template<class Iter>
struct iterator_traits
{
         typedef typename Iter::iterator_category iterator_category;
         typedef typename Iter::value_type value_type;
         typedef typename Iter::difference_type difference_type;
         typedef typename Iter::pointer pointer;
         typedef typename Iter::reference reference;
};
{% endhighlight %}

这样以后针对vector, list等的迭代器就可以用一致的方式去获取类型。
如 `iterator_traits< Iter >::iterator_category` 能一致的取出迭代器的属性


### tag dispatching

用一些空类型作为标签，在模板函数重载时，标签作为重载决议选择的依据，比如STL中算法针对不同的迭代器类型实现的策略：

{% highlight c++ %}
struct input_iterator_tag { };
struct bidirectional_iterator_tag { };
struct random_access_iterator_tag { };

namespace detail {
template <class InputIterator, class Distance>
void advance_dispatch(InputIterator& i, Distance n, input_iterator_tag) {
  while (n--) ++i;
}
template <class BidirectionalIterator, class Distance>
void advance_dispatch(BidirectionalIterator& i, Distance n,
         bidirectional_iterator_tag) {
  if (n >= 0)
    while (n--) ++i;
  else
    while (n++) --i;
}
//...

template <class RandomAccessIterator, class Distance>
void advance_dispatch(RandomAccessIterator& i, Distance n,
         random_access_iterator_tag) {
  i += n;
}
}// namespace detail

template <class InputIterator, class Distance>
void advance(InputIterator& i, Distance n)
{
  typename iterator_traits<InputIterator>::iterator_category category;
  detail::advance_dispatch(i, n, category);
}
{% endhighlight %}

用 iterator_category 标签实现了分派，比如：

- vector迭代器是random_access_iterator_tag
- list迭代器是bidirectional_iterator_tag

这样 `advance( Iter ,n )`能根据不同的迭代器类型，选择最优的策略。
 
### int to type

有些时候，整型作为派发的选择依据是有用的，这样可以在编译期创建一致的接口：
 
例子：

{% highlight c++ %}
#include <iostream>
#include <boost/array.hpp>
using std::cout;
 
template <int I>
struct Int2Type // 将整型映射为简单类型Int2Type<I>，而且各不相同
{
  enum { value = I };
};
 
template <class T, unsigned int N>
class Array : public boost::array <T, N>
{
  enum AlgoType { NOOP, INSERTION_SORT, QUICK_SORT };

  static const int algo = (N==0) ? NOOP :
         (N==1) ? NOOP :
         (N<50) ? INSERTION_SORT : QUICK_SORT;

  void sort (Int2Type<NOOP>)         {cout << "NOOP\n"; }
  void sort (Int2Type<INSERTION_SORT>) {cout << "INSERTION_SORT\n"; }
  void sort (Int2Type<QUICK_SORT>) {cout << "QUICK_SORT\n"; }
public:
  void sort()
  {
    sort (Int2Type<algo>());
  }
};
 
int main()
{
  Array<int, 1> a;
  a.sort(); // No-op!

  Array<int, 400> b;
  b.sort(); // Quick sort 
}
{% endhighlight %}

输出：  
NOOP  
QUICK_SORT  
 
### type to type

将原始类型封装做为标签，类型到类型的映射（派发）也是一种常用的方法，可以在编译期做好根据类型选择实现：

{% highlight c++ %}
template<typename T>
struct Type2Type { typedef T type;};
 
template<typename T, typename U>
T* Create( U const& arg, Type2Type<T> )
{// 默认情况
  return new T(arg);
}
template<typename U>
Widget* Create( U const& arg, Type2Type<Widget> )
{// 假设Widget的构造函数比较特殊，需要两个参数
  return new Widget(arg, -1);
}

// 使用：
string * pstr = Create( "hello", Type2Type<string>() );
Widget* pwid = Create( 100, Type2Type<Widget>() );
{% endhighlight %}


### adapter

配接器是模板类，所有功能都是在模板参数的类型基础上改装接口，提供出不同的一套接口。
STL中的逆向迭代器reverse_iterator是迭代配接器，以及stack是容器的配接器，如

{% highlight c++ %}
template<class _Ty, class _Container = deque<_Ty> >
class stack
{ // ...
  explicit stack(const _Container& _Cont) : c(_Cont) {}

  reference top() { return (c.back()); }
  void push(const value_type& _Val) { c.push_back(_Val); }
  void pop() { c.pop_back(); }

  _Container c;  
}
{% endhighlight %}
 
### SRTP 奇异的递归模板范式

这种模式（Curiously Recurring Template Pattern, CRTP）是借助模板和继承来实现的一种技巧。

基本的特征如下：

{% highlight c++ %}
class X  : public base<X>
{
  //...
};
{% endhighlight %}

1. X的基类是一个模板特化，而该模板特化的实参为X
2. X派生自一个了解自己的`base<X>`类，因此形成一种特殊的继承关系。
 
CRTP的能力：

- 静态多态 Static polymorphism(常用于ATL与WTL)，并且是编译期就决定调用的是基类还是派生类的方法，效率更高。
- 继承自基类，基类可以提供依赖派生类的实现的一系列函数，这些函数就像是定义在派生类中一样。
 
{% highlight c++ %}
template<class T>
struct Base
{
  int foo()
  {// 实现可以依赖于派生类的do_foo()，在编译期计算
    T& t = static_cast<T&>(*this);
    return t.do_foo();
  }
  // 当派生类不实现时的默认方法。可以不提供，这样派生类必须提供do_foo
  int do_foo() { }
};
 
struct Derived : public Base<Derived>
{
  int do_foo() { return 0; } // 特化自己的实现，覆盖基类
};
 
// 使用
Derived().foo();
{% endhighlight %}
 
### SFINAE

C++ 中模板函数重载依赖于 SFINAE (substitution-failure-is-not-an-error，替换失败不是错误) 原则 ：在函数模板的实例化过程中，如果形成的某个参数或返回值类型无效那么这个实例将从重载决议集中去掉而不是引发一个编译错误。

sizeof 可以在编译期计算表达式返回值类型的信息。
 
{% highlight c++ %}
typedef char yes;         // sizeof(yes) == 1
typedef char (&no)[2];    // sizeof(no)  == 2
 
template <class T>
struct is_class_or_union
{
  template <class U>
  static yes tester(int U::*arg); // 数据成员指针，U是类型或联合才行

  template <class U>
  static no tester(...);

  static bool const value= sizeof(tester<T>(0)) == sizeof(yes);

  typedef mpl::bool_<value> type;
};
{% endhighlight %}

### enable_if

先看个例子：

{% highlight c++ %}
int negate(int i) { return -i; }
 
template <class F>
typename F::result_type negate(const F& f) { return -f(); }
{% endhighlight %}

假设编译器遇到了 negate(1) 的调用。很明显第一个定义是个好选择，但是编译器必须在检查所有的定义后才能作出决定，这个检查过程包含对模板的实例化。使用 int 作为类型 F 对第二个定义进行实例化将产生：  
`int::result_type negate(const int&);`  
这里的返回值类型是无效的。
 
如果把这种情况看作是一种错误，那么添加一个无关的函数模板（从来不会被调用）也将导致原本有效的代码无法通过编译。

由于SFINAE原则的存在，上面的例子不会产生编译错误，在这种情况下编译器会简单地从重载决议集中抛弃后一个 negate 的定义。
 
 
enable_if 使得SFINAE原则成为一个惯用法。作为boost中的小工具，enable_if的实现很简单，代码也很少，推荐去看下源码。下面介绍enable_if的两个重要的能力。
 
- 对于函数模板：

{% highlight c++ %}
template <class T>
typename boost::enable_if<boost::is_arithmetic<T>, T >::type
foo(T t)
{
  T ret = T();
  // ...
  return ret;
}
 
// 这样以后：
foo(5);                // OK
// foo( string(“”) );  // 编译过不了，没有合适的foo来支持string
{% endhighlight %}

- 对于类模板，可以决策偏特化：

需要为模板添加一个额外的模板参数用于控制启用与禁用。这个参数的默认值是 void。  
比如：

{% highlight c++ %}
template <class T, class Enable = void>
class A { /*...*/ };    (a)
 
// 针对T为整型的特化
template <class T>
class A<T, typename enable_if<is_integral<T>, void >::type> // 该void可以省略
{
 // ...
 };              (b)
{% endhighlight %}

则：  
`A<string>` 选择默认的 (a)  
而`A<int>` 则选择偏特化的 (b)
 
### policy class

基本思想：基于策略的类型设计，如果一个类型中使用了多个独立的功能，并且这些功能又有可选的多个实现，这样可以把每个功能作为一个策略policy，让用户在使用类的时候根据需要选择需要的策略。这个思想的描述和实践出于C++天才Andrei Alexandrescu的《Modern C++ Design》。

例如：

Loki库中的SmartPtr声明：

{% highlight c++ %}
template
< 
  typename T,
  class OwnershipPolicy  = RefCounted,
  class ConversionPolicy  = DisAllowConversion,
  class CheckingPolicy     = AssertCheck,
  class StoragePolicy        = DefaultSPStorage
> 
class SmartPtr
: public StoragePolicy::In<T>::type
, public OwnershipPolicy::In<typename StoragePolicy::template PointerType<T>::type>::type
, public CheckingPolicy ::In<typename StoragePolicy::template StoredType<T>::type>::type
, public ConversionPolicy
{ };
{% endhighlight %}

使用的时候 只要typedef，选择各个策略，使用最适合自己的方案。
 
 
### lazy evaluation

缓式计算思想：将计算过程中的表达式存储起来，只在真正需要计算的那一刻才执行计算，常见的实现如：lambda表达式，表达式模板。

实现简单的赋值lambda表达式：
 
{% highlight c++ %}
#include <iostream>
#include <algorithm>
using namespace std;
// 常数表达式包装
template<typename T>
struct ValueExpr
{
  T const& val_;
  ValueExpr( T const& val ) : val_(val) {}

  template< typename U >
  T operator()( U const& ) const { return val_; } // 直接返回存储的常量
};
 
 
// 定义赋值表达式operator =
template<typename A, typename B>
struct AssignOp
{
  B right_;
  AssignOp( B const& rhs ) : right_(rhs) {}

  template< typename T >
  T& operator()( T& val ) // 最终执行计算
  {            // right可以是表达式，这个例子只是个常量
    return val = right_(val);
  }
};
 
 
// placeholder 赋值表达式的左值
template<typename T>
struct VariantHolder
{
AssignOp<VariantHolder<T>, ValueExpr<T> >
        operator = ( T const& val ) // 生成赋值表达式
{
  return AssignOp<VariantHolder<T>, ValueExpr<T> >( val );
}
};

int main()
{
  // 生成lambda表达式用于算法
  VariantHolder<int>           iVar; // placeholder

  int v[] = { 1, 2, 3, 4, 5 };
  for_each( v, v+5, iVar = 10 ); // assign lambda

  copy( v, v+5, ostream_iterator<int>(cout, " ") );
  cout << endl;
  return 0;
}
{% endhighlight %}

输出：10 10 10 10 10
 
 
## 模板元编程初步 template metaprogramming

- 定义：元数据 与 元函数
- 基本编译期技术
- 工具
- 后续学习实战

### 元数据

元数据metadata：可以在编译期进行操纵的实体。也被称为“纯函数式语言”，因为元数据不可变，没有副作用。
 
元数据分类：

1. 类型
2. 非类型：整型、枚举、函数和全局对象的指针，以及指向成员的指针。
 
### 元函数

元函数metafunction：boost.MPL引入的术语，将“类模板当成函数来使用”的思想。

{% highlight c++ %}
template<typename T>
struct metafunc
{
  typedef typename T::value_type type;
};
 
int func( vector<int>::iterator iter )
{//...
  return *iter;
}
{% endhighlight %}

编译期类模板的模板参数与内嵌类型  VS. 运行期函数的参数和返回值对应。
 
### 编译期基本技术

特化给类模板提供了极大的灵活性，只要添加一个特化就可以针对其参数特定的“值”（类型）非侵入式的修改模板的结果。

但是，想想运行时函数，没有这样的特化能力，针对值能直接选择另外的实现。
 
- 实现简单的静态断言

{% highlight c++ %}
template <bool assert_value>
struct STATIC_ASSERTION_FAILURE;
 
template <>
struct STATIC_ASSERTION_FAILURE<true> { enum { value = 1 }; };
 
#define static_assert( x ) STATIC_ASSERTION_FAILURE<x>::value;
{% endhighlight %}

这样：static_assert(0); 编译器将报错，因为没有实现`STATIC_ASSERTION_FAILURE<false>`
 
- 编译期类型选择

{% highlight c++ %}
template<bool condition, typename T1, typename T2>
struct IfThenElse
{
  typedef T1 ResultType; // 默认为T1
};
 
// 局部特化
template<typename T1, typename T2>
struct IfThenElse<false, T1, T2>
{
  typedef T2 ResultType; // 条件false选T2，则true选择默认的T1
};
{% endhighlight %}

这样 `IfThenElse< (2>1), int, string >:: ResultType` 为int
 
- 条件选择

{% highlight c++ %}
template<bool condition>
struct if_
{
  static void f();
};
 
template<>
struct if_<false> // 特化
{
  static void f();
};
{% endhighlight %}
 
利用模板特化机制实现编译期条件选择结构。
这样根据条件选择一个运行时函数：`if_< condition >::f()`
 
- 实现编译期循环（递归实例化，代码生成）

{% highlight c++ %}
template<int N>
struct for_
{
  static void f()
  {
    for_<N-1>::f(); // 要执行N，先执行N-1
    // 待执行的语句，比如tup.get<N>() 分别操纵每个Tuple的元素
  }
};

template<>
struct for_<0> // 特化
{
  static void f()
  {// 空，什么都不做，也就是到了终点      
  }
};
{% endhighlight %}


利用递归模板实现编译期循环结构，递归的终结采用模板特化实现。
这样：`for_<10>::f();` 会从0到10逐个调用
 
- 实现trait（标准的元函数：模板参数输入，内嵌数据输出）

- trait的基本格式：

{% highlight c++ %}
template<typename T>
struct trait_name
{
  typedef ... type;
  static const bool value = false;
};
{% endhighlight %}
 
通过模板技术来实现我们编写代码时需要的traits，例如：

{% highlight c++ %}
template<typename T, typename U>
struct is_same
{
  enum { value = false };
};

template<typename T>
struct is_same<T,T>
{
  enum { value = true };
};
{% endhighlight %}
 

模板元编程常用工具：

1. type_traits（已经被加入了标准库扩展TR1）
2. 静态断言
3. boost.mpl：包装了类似与运行期STL的一套编译期容器，迭代器，算法等
4. fusion 元组序列，tuple元组容器
5. proto表达式模板：用于构造嵌入C++的语言，这样就能用C++语法写对应的语法，例如：静态正则表达式xpressive就是嵌入式的正则表达式（文法在编译期就计算好，比运行期的regex更高效），它依赖于proto实现。
 

## 小结：

- 模板支持的语法基础
    - 理解：类模板和函数模板的特征，模板参数，特化
 
- 惯用法 idioms
    - 实践：当需要设计相对比较底层的代码时，想想能不能用上这些惯用法，来优化代码。
 
- 模板元编程初步
    - 学习：当设计一些比较泛化抽象的库或者一直封装的实现时，可能就需要代码生成的技巧。

## 参考资料：

1. 《C++ Templates : The Complete Guide 》 By David Vandevoorde, Nicolai M. Josuttis 陈伟柱 译
2. 《STL源码剖析》By 侯捷
3. 《C++ Template Metaprogramming Concepts Tools and Techniques from Boost and Beyond》By David Abrahams, Aleksey Gurtovoy (中文版：《C++模板元编程》荣耀 译)


 
