---
layout: article
title: 类型安全的格式化器
category: c++
---

像printf这样的格式化器，依赖字符串中`s%`等表示数据类型，变长参数并不类型安全。本文介绍一种类型安全的格式化器的构造思路。

类型安全的多参数的基本想法：

1. 要类型安全，必须使用函数重载，指定类型，不能使用…
2. 要尽量泛型，可以使用模板函数的重载
3. 由于仅仅是参数数目的不同，重复代码很多，考虑用tuple维持多参数列表，且使用预处理器preprocessor的文件迭代简化代码。


## 实现

{% highlight c++ %}
// 头文件
#ifndef BOOST_PP_IS_ITERATING
 
#ifndef FORMAT_H
#define FORMAT_H
 
#define FORMAT_LIMIT 10
 
#include <sstream>
#include <string>
#include <assert.h>
#include <boost/tuple/tuple.hpp>
#include <boost/preprocessor.hpp>
 
namespace detail_impl {
 
template<typename CH>
void format_impl( std::basic_string<CH>& resu_str, const CH* s )
{
    while ( s && *s )
    {
       assert( *s != CH('%') ); // missing arguments
       resu_str.push_back( *s++ );
    }
}
 
template<typename CH>
void format_impl( std::basic_string<CH>& resu_str, const CH* s, const boost::tuples::null_type& )
{
    format_impl( resu_str, s );
}
 
// 递归实例化的模板函数
template< typename CH, typename Tuple >
void format_impl( std::basic_string<CH>& resu_str, const CH* s, Tuple const& tup )
{
    while( s && *s )
    {
       if ( *s == CH('%') )
       {
           std::basic_ostringstream< CH> os;
           os << tup.get_head();
           resu_str += os.str();
           // tup.get_tail()产生新的Tuple，导致该实例化新的函数
           return format_impl( resu_str, ++s, tup.get_tail() );
       }
       resu_str.push_back( *s++ );
    }
    assert( 0 == boost::tuples::length<Tuple>::value ); // too many arguments
}
 
} // detail_impl
 
// 不带%格式符
template<typename CH>
static void format( std::basic_string<CH>& resu_str, const CH* format_str )
{
    resu_str.clear();
    detail_impl::format_impl( resu_str, format_str );
}
 
// self iterator direction
#define BOOST_PP_ITERATION_PARAMS_1 (3, (1, FORMAT_LIMIT, "format.h"))
#include BOOST_PP_ITERATE()
 
#endif// FORMAT_H
 
 
#else // self file iterator
#define n BOOST_PP_ITERATION()
 
template< typename CH, BOOST_PP_ENUM_PARAMS(n, typename ARG) >
static void format( std::basic_string<CH>& resu_str, const CH* format_str,
                  BOOST_PP_ENUM_BINARY_PARAMS( n, ARG, const& arg ) )
{
    resu_str.clear();
    boost::tuple<BOOST_PP_ENUM_PARAMS(n, ARG)> tup( BOOST_PP_ENUM_PARAMS(n, arg) );
    detail_impl::format_impl( resu_str, format_str, tup );
}
 
#endif// iterator end
{% endhighlight %}

## 测试


#include "format.h"
 
#include <iostream>
 
using namespace std;
 
struct Date
{
    int year;
    int month;
    int day;
 
    Date( int y, int m, int d ) :
       year(y), month(m), day(d)
    {}
};
 
ostream& operator << ( ostream& out, Date const& date )
{
    out << date.year << "-" << date.month << "-" << date.day;
    return out;
}
 
int main()
{
    string res;
    format( res, "test % yeah~%Yes%No % % % % % %", 12, string("zhenshan"), '%', 1, '2', 3, 4, 5, Date(2010,12,25) );
    cout << res << endl;
 
    return 0;
}
{% endhighlight %}