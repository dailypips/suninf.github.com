---
layout: article
title: result_of in boost
category: c++
---
***boost::result_of**模板用于识别函数(对象)返回类型，帮助**确定一个调用表达式的类型**。*

## result_of
给定一个类型 F 的左值 f 和类型 `T1, T2, ..., TN` 的左值 `t1, t2, ..., tN`，类型 `result_of<F(T1, T2, ..., TN)>::type` 定义了表达式 `f(t1, t2, ...,tN)` 的类型。

* 允许类型 F 是函数指针、函数引用、成员函数指针或类类型。
* 缺省情况下，N 可以是 0 到 10 之间的任意值。要修改上限，请定义宏 BOOST_RESULT_OF_NUM_ARGS 为 N 的最大值。
 
## 规则

* 对于普通函数或者模板函数，返回类型能直接推断，并且不依赖于参数。
* 如果 F 是一个函数对象类型，
    1. 若带有成员类型 result_type, 则 `result_of<F(T1, T2, ..., TN)>::type` 为 F::result_type
    2. 当 F 不带有 result_type 时，则 `result_of<F(T1, T2, ..., TN)>::type`
        * 当 N > 0 时为 `F::result<F(T1, T2, ..., TN)>::type`，即要求有内嵌的模板类；
        * 当 N = 0 时为 void
 
## 例子
{% highlight c++ %}
#include <boost/utility/result_of.hpp>
 
#include <iostream>
#include <string>
#include <typeinfo>
using namespace std;
 
struct functor
{
    template<class> struct result;
 
    template<class F, class T>
    struct result<F(T)>
    {
       typedef T type;
    };
 
    template<class T>
    T operator()(T x)
    {
       return x;
    }
};
 
typedef int (*FUN_TYPE)(int);
 
typedef string (functor::*fun_mem_ptr)(int);
 
struct functor2
{
    typedef functor result_type;
 
    result_type operator() ( int )
    {
       result_type ret;
       // ...
       return ret;
    }
};
 
int main()
{
    // 函数和成员函数的推断，参数无关
    cout << typeid( boost::result_of< FUN_TYPE(string, int) >::type ).name() << endl;
    cout << typeid( boost::result_of< fun_mem_ptr(string, int) >::type ).name() << endl;
   
    // 函数对象的返回值推断，由于依赖内嵌的result，参数类型有关
    cout << typeid( boost::result_of< functor(double) >::type ).name() << endl;
 
    // 参数数量为
    cout << typeid( boost::result_of< functor() >::type ).name() << endl;
 
    // 有内置的result_type，
    cout << typeid( boost::result_of< functor2(double) >::type ).name() << endl;
    cout << typeid( boost::result_of< functor2() >::type ).name() << endl;
 
    return 0;
}

// 输出：
// int
// class std::basic_string<char,struct std::char_traits<char>,class std::allocator<char> >
// double
// void
// struct functor
// struct functor
{% endhighlight %}


## 附boost_1.34 result_of的源码
{% highlight c++ %}
#include <boost/config.hpp>
#include <boost/type_traits/ice.hpp>
#include <boost/type.hpp>
#include <boost/preprocessor.hpp>
#include <boost/detail/workaround.hpp>
#include <boost/mpl/has_xxx.hpp>
 
#ifndef BOOST_RESULT_OF_NUM_ARGS
#  define BOOST_RESULT_OF_NUM_ARGS 10
#endif
 
namespace boost {
 
template<typename F> struct result_of;
 
#if !defined(BOOST_NO_SFINAE) && !defined(BOOST_NO_TEMPLATE_PARTIAL_SPECIALIZATION)
namespace detail {
 
BOOST_MPL_HAS_XXX_TRAIT_DEF(result_type)
 
template<typename F, typename FArgs, bool HasResultType> struct get_result_of;
 
// 有result_type的情况
template<typename F, typename FArgs>
struct get_result_of<F, FArgs, true>
{
  typedef typename F::result_type type;
};
 
// 没有result_type，如果参数不空，要求有result内嵌模板类
template<typename F, typename FArgs>
struct get_result_of<F, FArgs, false>
{
  typedef typename F::template result<FArgs>::type type;
};
 
template<typename F>
struct get_result_of<F, F(void), false>
{
  typedef void type;
};
 
template<typename F, typename FArgs>
struct result_of : get_result_of<F, FArgs, (has_result_type<F>::value)> {};
 
} // end namespace detail
 
#define BOOST_PP_ITERATION_PARAMS_1 (3,(0,BOOST_RESULT_OF_NUM_ARGS,<boost/utility/detail/result_of_iterate.hpp>))
#include BOOST_PP_ITERATE()
 
#else
#  define BOOST_NO_RESULT_OF 1
#endif
 
}
{% endhighlight %}
 
注：

1. `BOOST_MPL_HAS_XXX_TRAIT_DEF(result_type)`定义了模板类型has_result_type，`has_result_type<F>::value`表示F是否具有result_type的内嵌typedef
2. result_of_iterate.hpp：针对模板参数的数目，文件迭代来写
3. 至于普通函数与成员函数类型的实现，细节被包含在BOOST_MPL_HAS_XXX_TRAIT_DEF中。
 
