---
layout: article
title: C++模板递归实例化
category: c++
---
模板的递归实例化可以分为类模板和函数模板两种。关键是形成依赖，基本内容是编译期类型和常整型值的计算(或者借助于模板函数类型推导)。
 
## 类模板
对于类模板来说，**使用自身的模板特化（模板参数递进）的成员而形成依赖，导致模板类递归实例化**，需要用**类模板的特化来指定递归终点**。
 
例子（**编译期判断素数及打印**）：
{% highlight c++ %}
#include <iostream>
using namespace std;
 
template< int N, int P, bool Flag >
struct Check;
 
template< int N >
struct IsPrime
{
    // Check<N/2,N,true>::result 的结果就是是否为素数
    static const bool value = Check<N/2,N,true>::result;
};
 
template<>
struct IsPrime<1>
{
    static const bool value = false;
};
 
template<>
struct IsPrime<2>
{
    static const bool value = true;
};
 
// Flag用作递归状态传入
template< int N, int P, bool Flag >
struct Check
{
private:
    static const bool tmp = 
        IsPrime<N>::value ? (P%N != 0)&&Flag : Flag;
 
public:
    static const bool result = tmp ? Check<N-1,P,tmp>::result : false;
};
 
template< int P, bool Flag >
struct Check<1, P, Flag>
{
    static const bool result = Flag;
};
 
// 是否是素数的信息IsPrime<N>::value --> true or false
template < int N > // 打印小于N的素数
struct PrintPrimes
{
    void operator () ()
    {
       PrintPrimes<N-1>()();
       Print< IsPrime<N>::value, N >::pt();
    }
};
 
template<>
struct PrintPrimes<2>
{
    void operator()()
    {
       cout << 2 << endl;
    }
};
 
// 被PrintPrimes使用(选择素数打印)
template<bool flag, int p>
struct Print
{
    static void pt()
    {
       cout << p << endl;
    }
};
 
template<int p>
struct Print<false,p>
{
    static void pt() { }
};
 
 
int main()
{
    PrintPrimes<150>()();
    return 0;
}
{% endhighlight %}
 
## 函数模板
对于函数模板来说，也是因为在函数中**调用了同名模板函数（但是模板参数不同），也形成递归实例化**，递归重点的设置，是写一个重载的函数即可（因为我们知道终点的特点，它能比模板函数匹配的更好）。

例子（类型安全的format函数）：  

类型安全的多参数的基本想法：
1.	要类型安全，必须使用函数重载，指定类型，不能使用…
2.	要尽量泛型，可以使用模板函数的重载
3.	由于仅仅是参数数目的不同，重复代码很多，考虑用tuple维持多参数列表，且使用预处理器preprocessor的文件迭代简化代码。

{% highlight c++ %}
// 头文件 format.h
/*
format(格式化字符串函数)：
1、由于编译期类型识别，格式化字符串format_str不用再加上类似于（printf）的%d来表示int的方法，只需要一个'%'来表示该位置需要被替换
2、格式format( result, format_str, arg1,...,argN )
	-> 要求输出目标result是basic_string<T>的类型
	-> argn为可输出的参数，要求format_str的'%'数量和N的大小一致
	-> 采用预处理元编程，文件迭代，预处理期生成代码, 最多支持的参数由FORMAT_LIMIT可配置
例：
wstring res;
format( res, L"% yes % no %", 100, wstring(L"sjw"), 'd' );
*/

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

{% highlight c++ %}
// 源文件
/*
类型安全的格式化器：
1、借助函数模板递归实现tuple的逐个取用
2、借助预处理元编程减少编写的代码量，借助preprocessor预处理元编程引擎可以很方便的书写，而且有很好的使用文档
3、借助ostringstream可扩展的进行格式化
*/

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

