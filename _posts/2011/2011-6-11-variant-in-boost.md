---
layout: article
title: variant in boost
category: boost
---

传统的联合union，只是对POD（Plain Old Data）类型有效，不可以使用带有非平凡构造或析构的类型。如果我们需要使用自定义的class作为联合的某个类型，union无计可施。而在C++领域，使用联合时很有可能涉及到使用非POD的类型。

variant 类模板是一个安全的、泛型的、基于栈的、可识别的高效联合容器，为以统一风格操作异类类型集合的对象提供了一个简单的方法。像 std::vector 这样的标准容器可以被视为 "多值，单一类型"，而 variant 则是 "多类型，单值"。
 
boost::variant特点：

- 完全的值语义，包括遵守转换操作符的标准重载规则。
- 经由 `boost::apply_visitor` 的编译期类型安全的值访问。
- 经由 `boost::get`的运行期带检查的显式的值取出。
- 通过 `boost::make_recursive_variant` 和 `boost::recursive_wrapper` 支持递归的 variant 类型。
 
## 基本使用

### variant联合容器构造及赋值

需要对模板参数指定T1, T2,…, TN为联合容器支持的类型，这些类型为有界类型，它们满足条件：可复制构造、析构函数无异常、类型完整。

（1）、`variant< T1, T2,…, TN > v;` //默认构造  
这时会默认构造T1类型

（2）、`variant< T1, T2,…, TN > v( t );` //单参数构造      v = t;//赋值  
要求t至少可以构造转化为T1, T2,…, TN中某一个类型，但是又不可以隐式转化为其中的两个类型。

（3）、`variant< T1, T2,…, TN > v( v0 );` //复制构造        v = v0; //赋值  
要求v0与v对应的variant类型的模板参数签名一致。或者能够从v0的签名的类型转化为v的对应类型。
 
### 几个函数说明

1. 如果每个类型都支持`<<`流输出，则variant对象也支持，并且输出为当前对应的类型的值。
2. 如果每个类型都支持`==, <`，则variant对象也对应的支持`==, <`，并且比较使用当前的类型对应值比较。
3. `which()`返回当前对应的类型在模板签名中的index，序号从0开始。
 
### 访问值

有两种方式：apply_visitor强大而安全的访问器；`get<T>()`有时比较方便，但性能和安全性不高

1、`get`

~~~~
get<T>( v ) // 返回T&，如果当前恰好对应T类型，则返回引用；否则抛出异常
get<T>( &v ) // 返回T*，如果当前为T类型，则返回对象指针；否则返回0
~~~~

2、`apply_visitor`更鲁棒的访问器，编译期检查的访问机制

这种方式需要定义静态访问者(static visitor)。显式处理（或者忽略）varant的每个类型，否则会编译错误。

定义一个静态访问者visitor类的要求：

- 必须通过重载 operator() 以支持象函数那样的调用，明确接受类型为 T 的任意值。
- 必须提供内嵌类型 result_type
- 如果 result_type 不是 void, 则该函数对象的每个操作必须返回一个可以隐式转换为 result_type 的值。

 
**一元访问者的格式**

~~~~
struct Visitor : public static_visitor< ReturnType >
{
    // 注意也可以使用模板来处理一般的，而显式处理特殊的
    ReturnType operator() ( const T1& )  const { … } 
    ReturnType operator() ( T2& )  const { … }
    …
    ReturnType operator() ( TN& )  const { … }
};
~~~~

使用时，例如：

- `apply_visitor(visitor(), vari );` 需要一个visitor对象和一个variant对象
- 另外，可以从函数直接得到静态访问者 `visitor_ptr( &fun )`，不过如果使用的类型不匹配的话，抛出异常。
 
**二元访问者**：处理两个variant之间的关系

~~~~
struct Visitor : public static_visitor< ReturnType >
{
    template< typename T, typename U >
    ReturnType operator() ( const T& t, const U& u )  const { }
};
~~~~

由于T, U支持不同类型的，要达到有效性有时需要辅助的技巧。

注意静态访问者本身也是函数对象。
 
**访问器apply_visitor函数**（绑定访问者和被访问的variant）的一些重载函数：

~~~~
return_type apply_visitor(Visitor & visitor, Variant & operand); // visitor是引用的，暗示是可以带状态的
return_type apply_visitor(const Visitor & visitor, Variant & operand);
return_type apply_visitor(BinaryVisitor & visitor, Variant1 & operand1, Variant2 & operand2);
return_type apply_visitor(const BinaryVisitor & visitor, Variant1 & operand1, Variant2 & operand2);
//提供visitor对象以及单个或者两个的variant对象，进行访问内容并调用对应的访问者。
 
apply_visitor_delayed_t<Visitor> apply_visitor(Visitor & visitor);
//延迟调用，返回绑定了visitor的函数对象，之后可以接受单个或者两个的variant对象，关键看visitor的类型。
~~~~

例1：一元静态访问

{% highlight c++ %}
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;
 
#include <boost/variant.hpp>
using namespace boost;
 
struct Test : static_visitor<>
{
    template<typename T>
    void operator() ( const T& t ) const
    {
       cout << t << endl;
    }
    void operator() ( string& s ) const // 仅对string类型特殊处理
    {
       s = s+s;
       cout << s << endl;
    }
};
 
int main()
{
    vector< variant<int,string,double> > vect;
    vect.push_back( 15 );
    vect.push_back( "sjw" );
    vect.push_back( 3.14 );
    
    for_each( vect.begin(), vect.end(), apply_visitor(Test()) ); //lazy
    
    return 0;
}
{% endhighlight %}

 
例2：二元静态访问

{% highlight c++ %}
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <sstream>
using namespace std;
 
#include <boost/variant.hpp>
using namespace boost;
 
struct lexi_visitor : public static_visitor<bool>
{
    template< typename T, typename U >
    bool operator()( const T& t, const U& u ) const // 按照输出格式作为排序规则
    {
        return get_string(t) < get_string(u);
    }      
private:
    template< typename T >
    static string get_string( const T& t ) // 辅助函数，得到输出的string形式
    {
        ostringstream ostr;
        ostr << t;
        return ostr.str();       
    }   
    static const string& get_string( const string& s )
    {
        return s;
    }
};
 
struct pt
{
    template< typename Vari >    
    void operator() ( Vari const& v )
    {
        cout << v << endl;
    }
};
 
int main()
{
    vector< variant<int,string,double> > vect;
    vect.push_back( 15 );
    vect.push_back( "sjw" );
    vect.push_back( 3.14 );
    vect.push_back( "14" );
    vect.push_back( "3.15" );
    
    // 这里使用lexi_visitor()也是可以的，因为variant恰好也能输出^^
    sort( vect.begin(), vect.end(),apply_visitor( lexi_visitor() ));
    for_each( vect.begin(), vect.end(), pt() );
    
    return 0;
}
{% endhighlight %}

输出已序：  
14  
15  
3.14  
3.15  
sjw
 
 
### 用一个类型序列来指定有界类型`<T1,T2,…,TN>`

boost::mpl的类型序列Sequence，例如mpl::vector等，可以利用trait类make_variant_over来生成一个variant类型，例如：

~~~~
typedef mpl::vector<int,double,string> init_type;
typedef mpl::push_front< init_type, char > vari_argu_type;

make_variant_over< vari_argu_type >::type var;
//等价于：variant<char,int,double,string> var;
~~~~
 
## 递归的 variant 类型

例如，想要定义

~~~~
struct add;// 仅作为标记
struct sub;// 仅作为标记

template <typename OpTag> struct binary_op; // 注意binary_op的实现还没完成

typedef boost::variant
<
    int
    , binary_op<add>// 计算类型，但是binary_op模板类内容还没定义，不完整类型，导致编译出错
    , binary_op<sub>
> expression;
~~~~

variant 含有对 boost::recursive_wrapper 类模板的特殊支持，它可以打破作为问题核心的循环依赖。

{% highlight c++ %}
typedef boost::variant
<
    int
    , boost::recursive_wrapper< binary_op<add> >
    , boost::recursive_wrapper< binary_op<sub> >
> expression; // 成功实现不完全类型的延时
{% endhighlight %}
 
例程：

{% highlight c++ %}
#include <iostream>
using namespace std;
 
#include <boost/variant.hpp>
using namespace boost;
 
struct add; // 标记
struct sub;
 
template <typename OpTag>
struct binary_op; // 注意binary_op的实现还没完成
 
typedef boost::variant
< 
    int,
    boost::recursive_wrapper< binary_op<add> >, // 注意下面binary_op的定义依赖于expression类型
    boost::recursive_wrapper< binary_op<sub> >
> expression;
// 成功实现不完全类型的延时
// expression到目前为止也是不完整的，完整性依赖于binary_op的定义
 
template <typename OpTag>
struct binary_op //定义内容
{
    expression left;  // variant 在此实例化
    expression right;
 
    binary_op( const expression & lhs, const expression & rhs )
       : left(lhs), right(rhs)
    {
    }
 
};
 
class calculator : public static_visitor<int> // 一元访问器
{
public:
 
    int operator()(int value) const
    {
       return value;
    }
 
    int operator()(const binary_op<add> & binary) const
    {
       return boost::apply_visitor( calculator(), binary.left ) 
           + boost::apply_visitor( calculator(), binary.right );   
    }   
    int operator()(const binary_op<sub> & binary) const   
    {       
       return boost::apply_visitor( calculator(), binary.left )           
           - boost::apply_visitor( calculator(), binary.right );   
    }
};

int main()
{
    expression var = binary_op<add>( 1, binary_op<sub>(5,6) );
 
    cout << apply_visitor( calculator(), var ) << endl;// 1 + 5 - 6
 
    return 0;
}
{% endhighlight %}