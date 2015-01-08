---
layout: article
title: proto转换(transform)使用实例
category: boost
---

## 带占位符的加法计算器

{% highlight c++ %}
#include <iostream>
#include <vector>
#include <functional>
 
#include <boost/proto/proto.hpp>
namespace proto = boost::proto;
 
template<int N>
struct placeholder {};
 
proto::terminal< placeholder<0> >::type _1 = {{}};
proto::terminal< placeholder<1> >::type _2 = {{}};
 
// 获取terminal< placeholder<N> >终结符值的可调用转换
template<int N, typename dummy = proto::callable>
struct get_data : proto::callable
{
    typedef int result_type;
 
    result_type operator() ( std::vector<int> const& arg )
    {
       if ( arg.size() >= (N+1) )
       {
           return arg[N];
       }
       return 0;
    }
};
 
// 简单计算器语法
struct calculator
    : proto::or_<
    proto::when<
       proto::terminal< placeholder<0> >,
        get_data<0>( proto::_data )
    >,
    proto::when<
       proto::terminal< placeholder<1> >,
       get_data<1>( proto::_data )
    >,
    proto::when<
       proto::terminal< int >,
       proto::_value
    >,
    proto::when<
       proto::plus<calculator, calculator>,
       // 遇到加号，将左右两边的值相加，使用proto::call<>
       proto::call< std::plus<int>( calculator(proto::_left), calculator(proto::_right) ) >
    >
    >
{};
 
int main()
{
    std::vector<int> vec;
    vec.push_back( 3 );
    vec.push_back( 4 );
 
    // 使用了vec作为转换的data参数（proto::_data）
    int n = calculator()(_1 + _2 + 10, 0, vec );
    std::cout << n << std::endl;
 
    return 0;
}
{% endhighlight %}

输出：17
 
 
## 实现lazy的vector，消除运算过程中的临时数组

{% highlight c++ %}
#include <vector>
#include <iostream>
 
#include <boost/mpl/int.hpp>
namespace mpl = boost::mpl;
 
#include <boost/proto/proto.hpp>
namespace proto = boost::proto;
using proto::_;
 
// 终结符用下标获取对应值
struct Subscript : proto::callable
{
    // 内嵌result<Sig>模板，签名推导返回类型的方式
    template<typename Sig>
    struct result;
 
    template<typename This, typename Cont, typename Idx>
    struct result<This(Cont, Idx)>
    {
       typedef typename boost::remove_const<
           typename boost::remove_reference<Cont>::type >::type Cont_type;
 
       typedef typename Cont_type::value_type type;
    };
 
    template<typename Cont>
    typename result<Subscript(Cont, size_t)>::type
    operator() ( Cont const& vec, size_t n ) const
    {
       return vec[n];
    }
};
 
// 标识操作运算
enum ExprOpType { OP_ADD, OP_MINUS };
 
// 操作运算实现
struct ExprOp : proto::callable
{
    // 也需要内嵌result<>来推导返回类型
    template<typename Sig>
    struct result;
 
    template<typename This, typename T, typename Op>
    struct result< This(T, T, Op) >
    {
       typedef T type;
    };
 
    template<typename T, typename Op>
    typename result< ExprOp(T, T, Op) >::type
    operator() ( T const& lhs, T const& rhs, Op ) const
    {
       if ( Op::value == OP_ADD )
       {
           return lhs + rhs;
       }
       else if ( Op::value == OP_MINUS )
       {
           return lhs - rhs;
       }
 
       return T();
    }
};
 
// lazy vector语法，
// 语法transform 使用data作为下标来取值
struct LazyVectorGrammar
    : proto::or_<
    proto::when<
       proto::terminal< std::vector<_> >
       , Subscript(proto::_value, proto::_data)
    >
    , proto::when<
       proto::plus< LazyVectorGrammar, LazyVectorGrammar >
       , ExprOp( proto::call<LazyVectorGrammar(proto::_left)>,
       proto::call<LazyVectorGrammar(proto::_right)>,
       mpl::int_<OP_ADD>() )
    >
    , proto::when<
       proto::minus< LazyVectorGrammar, LazyVectorGrammar >
       , ExprOp( proto::call<LazyVectorGrammar(proto::_left)>,
       proto::call<LazyVectorGrammar(proto::_right)>,
       mpl::int_<OP_MINUS>())
    >
    >
{};
 
// 前置声明domain
struct lazy_vector_domain;
 
// expr
template<typename Expr>
struct lazy_vector_expr
    : proto::extends<Expr, lazy_vector_expr<Expr>, lazy_vector_domain>
{
    typedef proto::extends<Expr, lazy_vector_expr<Expr>, lazy_vector_domain> base_type;
 
    lazy_vector_expr( Expr const & expr = Expr() )
       : base_type( expr )
    {}
 
    // 表达式下标计算，使用语法transform
    template< typename Size >
    typename boost::result_of< LazyVectorGrammar(lazy_vector_expr<Expr>, int, Size) >::type
       operator []( Size subscript ) const
    {
       return LazyVectorGrammar()( *this, 0, subscript );
    }
};
 
// lazy_vector终结符，即：
// lazy_vector_expr< typename proto::terminal< std::vector<T> >::type >
template< typename T >
struct lazy_vector
    : lazy_vector_expr< typename proto::terminal< std::vector<T> >::type >
{
    typedef typename proto::terminal< std::vector<T> >::type terminal_type;
 
    lazy_vector( std::size_t size = 0, T const & value = T() )
       : lazy_vector_expr<terminal_type>( terminal_type::make( std::vector<T>( size, value ) ) )
    {}
 
    // operator +=
    template< typename Expr >
    lazy_vector& operator += (Expr const & expr)
    {
       // *this作为终结符proto::terminal< std::vector<T> >::type
       std::size_t size = proto::value(*this).size();
 
       for(std::size_t i = 0; i < size; ++i)
       {// expr[i] 表达式的下标运算，用了LazyVectorGrammar
           proto::value(*this)[i] += expr[i];
       }
       return *this;
    }
 
    // operator =
    template< typename Expr >
    lazy_vector& operator = (Expr const & expr)
    {
       std::size_t size = proto::value(*this).size();
       for(std::size_t i = 0; i < size; ++i)
       {
           proto::value(*this)[i] = expr[i];
       }
       return *this;
    }
};
 
// 实现domain
struct lazy_vector_domain
    : proto::domain<proto::generator<lazy_vector_expr>, LazyVectorGrammar>
{};
 
int main()
{
    lazy_vector< double > v1( 4, 1.0 ), v2( 4, 2.0 ), v3( 4, 3.0 );
 
    // 计算过程中没有产生临时的数组
    double d1 = ( v2 + v3 )[ 2 ];
    std::cout << d1 << std::endl;
 
    v1 += v2 - v3;
    std::cout << '{' << v1[0] << ',' << v1[1]
    << ',' << v1[2] << ',' << v1[3] << '}' << std::endl;
 
    v1 = v2 + v3;
    std::cout << '{' << v1[0] << ',' << v1[1]
    << ',' << v1[2] << ',' << v1[3] << '}' << std::endl;
 
    return 0;
}
{% endhighlight %}

输出：  
5  
{0,0,0,0}  
{5,5,5,5}  
 
 
## 实现map的初始化序列

通过一个简明的语法来实现map的初始化，与map多次insert一样，没有任何额外的开销。

{% highlight c++ %}
#include <map>
#include <string>
#include <iostream>
#include <boost/proto/proto.hpp>
#include <boost/type_traits/add_reference.hpp>
namespace proto = boost::proto;
using proto::_;
 
struct map_list_of_tag
{};
 
// 可调用转换将(key,value)对插入到map，并返回map
struct insert
    : proto::callable
{
    template<typename Sig>
    struct result;
 
    template<typename This, typename Map, typename Key, typename Value>
    struct result<This(Map, Key, Value)>
       : boost::add_reference<Map>
    {};
 
    template<typename Map, typename Key, typename Value>
    Map& operator()(Map &map, Key const &key, Value const &value) const
    {
       map.insert(typename Map::value_type(key, value));
       return map;
    }
};
 
// map-list表达式函数调用的语法，也是转换计算返回map
struct MapListOf
    : proto::or_<
    proto::when<
       // map_list_of( key, value )的情况，直接insert
       proto::function<
           proto::terminal<map_list_of_tag>
           , proto::terminal<_>
           , proto::terminal<_>
       >
       , insert(
           proto::_data // 初始使用_data
           , proto::_value(proto::_child1)
           , proto::_value(proto::_child2)
           )
    >
    , proto::when<
       // 对于map_list_of(key1, value1)(key2, value2)
       // 先递归计算_child0: map_list_of(key1, value1)，得到新map后再insert
       proto::function<
           MapListOf
           , proto::terminal<_>
           , proto::terminal<_>
       >
       , insert(
           MapListOf(proto::_child0) // 递归计算子表达式，返回新状态的map
           , proto::_value(proto::_child1)
           , proto::_value(proto::_child2)
           )
    >
    >
{};
 
template<typename Expr>
struct map_list_of_expr;
 
// domain
struct map_list_of_dom
    : proto::domain<proto::pod_generator<map_list_of_expr>, MapListOf>
{};
 
// 使用宏扩展（不用继承），得到POD类型，可静态初始化
template<typename Expr>
struct map_list_of_expr
{
    BOOST_PROTO_BASIC_EXTENDS(Expr, map_list_of_expr, map_list_of_dom)
    BOOST_PROTO_EXTENDS_FUNCTION()
 
    // 表达式转换为map
    template<typename Key, typename Value, typename Cmp, typename Al>
    operator std::map<Key, Value, Cmp, Al> () const
    {
       BOOST_MPL_ASSERT((proto::matches<Expr, MapListOf>));
       std::map<Key, Value, Cmp, Al> map;
       // 计算map_list_of_expr表达式，map作为_data传入
       return MapListOf()(*this, 0, map);
    }
};
 
// 静态初始化终结符，用于产生function<>表达式
map_list_of_expr< proto::terminal<map_list_of_tag>::type > const map_list_of = {{{}}};
 
int main()
{
    // Initialize a map:
    std::map<std::string, int> op =
       map_list_of
       ("<", 1)
       ("<=",2)
       (">", 3)
       (">=",4)
       ("=", 5)
       ("<>",6)
       ;
    std::cout << "\"<\" --> " << op["<"] << std::endl;
    std::cout << "\"<=\" --> " << op["<="] << std::endl;
    std::cout << "\">\" --> " << op[">"] << std::endl;
    std::cout << "\">=\" --> " << op[">="] << std::endl;
    std::cout << "\"=\" --> " << op["="] << std::endl;
    std::cout << "\"<>\" --> " << op["<>"] << std::endl;
    return 0;
}
{% endhighlight %}

输出：

~~~~
"<" --> 1
"<=" --> 2
">" --> 3
">=" --> 4
"=" --> 5
"<>" --> 6
~~~~

注：

1. map_list_of是POD的静态初始化，在程序开始之前，以完成初始化，是安全的。
2. 代码非常精炼，基本POD表达式框架map_list_of_expr 和 语法MapListOf（辅助可调用转换insert）。
3. 实际的插入顺序是由语法转换MapListOf决定的，这里insert的先后是从前往后。
