---
layout: article
title: proto in boost
category: boost
---

命名约定：
 
函数
: 所有函数定义下名字空间boost::proto下，例如函数value()定义在boost::proto下，它接受一个终结表达式，并返回终结符的值。
 
元函数
: proto定义了与所有函数相对应的元函数，用于计算对应函数的返回类型，所有元函数定义在`boost::proto::result_of`下，例如类模板`boost::proto::result_of::value<>`用于计算函数`boost::proto::value()`的返回值类型。
 
函数对象
: proto定义了与所有函数相等价的函数对象，proto的函数对象都定义在`boost::proto::functional`下，例如boost::proto::functional::value是一个函数对象类型，行为与boost::proto::value一致。
 
基元转换
: proto定义了基元转换（可以用来组合成更大的转换来计算表达式树），大部分proto函数定义了对应的基元转换，在名字空间`boost::proto`下，并且带下划线打头，例如与函数value()对应的转换为boost::proto::_value


## 定义终结符和非终结符

### 定义终结符

使用`proto::terminal<user_type>::type`定义终结符，例如：

~~~~
proto::terminal<int>::type i = {0};
~~~~

另外，方便起见，proto定义了更直接的`proto::literal<>`来定义字面值终结符：

~~~~
proto::literal<int> i = 0;
i + 1; // 表达式
~~~~

并且提供proto::lit() 函数来支持在线的生成字面值终结符：

~~~~
proto::lit( string(“hello world”) ) + 1;
_1 + proto::lit(std::vector<int>());
~~~~

### proto的运算符重载

有了终结符，就可以开始建立表达式树（expression trees）了，proto在名字空间boost::proto中为我们重载了所有可以重载的C++运算符。只要运算符的一边是proto表达式，那么运算结果就是代表该运算的树节点。

例如：  

~~~~
-_1;        // 一元负号的树节点  
_1 + 42;    // 二元加号的树节点  
~~~~

- 赋值、下标和函数调用 运算符

对于`operator=`, `operator[]`, `operator()`，定义为表达式模板的成员函数。

例如：

~~~~
_1 = 5; // 二元赋值树节点
_1[6];      // 二元下标树节点
_1();       // 一元函数树节点
_1(8, 9);   // 三元函数树节点
~~~~

注意：

1. 表达式`_1()`有一个child，即_1；而表达式`_1( 8, 9 )`有3个child，即_1, 8, 9。
2. 由于这3个运算符定义为成员函数，下面的表达式非法：

~~~~
int i;
i = _1; 

int *p;
p[_1]; 

sin(_1); // 非法，sin不接受_1类型的参数
~~~~

- 取地址运算符

proto定义取地址运算符`operator&`，因此 `&_1`是合法的一元取地址树节点，不过它不是返回_1对象的地址，而是返回了指向表达式的child的指针。

例如：

~~~~
typedef proto::terminal< placeholder<0> >::type _1_type;
_1_type const _1 = {{}};
_1_type const * p = &_1;        // 返回指向_1的指针
~~~~

### 函数调用表达式

- 从函数指针定义终结符

例如：

{% highlight c++ %}
proto::terminal< double(*)(double) >::type sin = { &std::sin };
double pi = 3.1415926535;
proto::default_context ctx;
std::cout << proto::eval( sin(pi/2), ctx ) << std::endl; // 1
{% endhighlight %}

注意：

1. sin是终结符表达式，由于所有的proto表达式都定义了operator()，因此sin(pi/2)本身是个合法的C++表达式，并且默认还是个proto表达式，并且是缓式的函数（Lazy Function），在执行计算proto::eval时，才会根据对应的上下文context来执行计算。
2. 默认的上下文default_context只适合充分C++形式的表达式计算。
3. 对于函数调用表达式，左边节点必须可以计算为可调用对象：函数指针、函数对象（带内嵌result_type返回值类型的typedef）。

例子：

{% highlight c++ %}
#include <iostream>
using namespace std;

#include <boost/proto/proto.hpp>
using namespace boost;

struct IsOddFunc 
{
    typedef bool result_type;
    bool operator() ( int n ) const
    {
        return n%2 == 1;
    }
};

int main()
{
    proto::terminal<IsOddFunc>::type IsOdd = { IsOddFunc() };

    proto::default_context ctx;
    cout << proto::eval( IsOdd(4), ctx ) << endl;

    return 0;
}
{% endhighlight %}


- 用proto::function建立函数调用表达式

比如需要达到这样的效果：`pow<2>( _1 )`

首先，根据C++语法，pow不能是对象，它需要是个函数模板，并且调用返回表达式。

这需要借助于`proto::function`来实现，它用于产生函数调用表达式类型。

例子：

{% highlight c++ %}
#include <iostream>
#include <vector>

#include <boost/proto/proto.hpp>
using namespace boost;

template<int Exp>
struct pow_fun // 函数对象
{
    typedef double result_type;
    double operator()(double d) const
    {
        return std::pow(d, Exp);
    }
};

template<int Exp, typename Arg>
typename proto::function<
    typename proto::terminal<pow_fun<Exp> >::type
    , typename proto::result_of::as_child<Arg const>::type // 支持非表达式
>::type const
pow(Arg const &arg) // 实现的函数模板
{
    typedef
        typename proto::function<
        typename proto::terminal<pow_fun<Exp> >::type
        , typename proto::result_of::as_child<Arg const>::type
        >::type
        result_type;

    result_type result = {{{}}, proto::as_child(arg)};
    return result;
}

// 为支持_1定义的占位符和对于的context
template<int I>
struct placeholder {};

proto::terminal<placeholder<0> >::type const _1 = {{}};

struct calculator_context
    : proto::callable_context< calculator_context const >
{
    std::vector<double> args;

    typedef double result_type;

    template<int I>
    double operator()(proto::tag::terminal, placeholder<I>) const
    {
        return this->args[I];
    }
};

int main()
{
    proto::default_context ctx;
    std::cout << proto::eval( pow<2>(3), ctx ) << std::endl;

    calculator_context calc_ctx;
    calc_ctx.args.push_back(5);
    std::cout << proto::eval( pow<3>( _1 + 2 ), calc_ctx ) << std::endl;

    return 0;
}
{% endhighlight %}

注意：

1. proto表达式必须以其他proto表达式为子表达式，注意proto::function的模板参数，第一个为`typename proto::terminal<pow_fun<Exp> >::type`的proto函数调用表达式，第二个为函数调用的参数，但是包装为proto::as_child，以支持非proto表达式类型的Arg参数。这样就能既支持`pow<2>(3)`又支持`pow<3>( _1 + 2 )`。
2. 任何proto表达式在计算时都可以指定特别的context来处理对应场景，上面的calculator_context对于计算`placeholder<I>`的值给定了方式。


- 使用make_expr来简化类型表达

proto::make_expr通过指定表达式Tag，Domain，以及参数，能建立对应的proto表达式。

上述例子的pow函数模板可以简化为：

{% highlight c++ %}
template<int Exp, typename Arg>
typename proto::result_of::make_expr<
    proto::tag::function        // Tag type
    , pow_fun<Exp>              // First child (by value)
    , Arg const &               // Second child (by reference)
>::type const
pow(Arg const &arg)
{
    return proto::make_expr<proto::tag::function>(
        pow_fun<Exp>()          // First child (by value)
        , boost::ref(arg)       // Second child (by reference)
        );
}
{% endhighlight %}

注意：

1. proto::result_of::make_expr计算返回类型，首模板参数为tag::function，表示为函数调用表达式。其他的模板参数为子节点，并且默认已经做了，如果模板参数类型为非proto表达式，使用proto::as_child包装。
2. 可以指定模板参数是否使用引用方式，例如`pow_fun<Exp>`指定该终结符以by value方式传递。对于以引用方式的，在用`proto::make_proto<tag::function>( … )`时，对应的参数需要用boost::ref包装参数。


### 域（domain）与表达式扩展

- **域**

在proto中，域是一个类型，它将域中的表达式与一个表达式发生器( expression generator )相关联，并且还可以将域中的表达式与语法( grammar )相关联，来产生约束。

1. 表达式发生器是函数对象，它接受一个表达式，并且对它做些事情。
2. 域中语法约束能保证域的合法表达式在语法定义的范围内，通过限制运算符重载来达到限制表达式语法。

- `extend<>` 扩展表达式包装

比如，希望这句话起作用：

~~~~
double data[] = {1., 2., 3., 4.};
std::transform( data, data + 4, data, _1 * _1 );
~~~~

但是`_1*_1`仅仅是个表达式，它的operator()也不会接受double类型，也不会返回两者的乘积。除非我们指定这样的定义，即定义这个特定的operator()成员函数的表达式包装，并且将它与域对应起来。

看个完整的例子：

{% highlight c++ %}
#include <iostream>
#include <algorithm>
#include <vector>

#include <boost/proto/proto.hpp>

namespace proto = boost::proto;

// 占位符placeholder
template<int I>
struct placeholder {};

// context
struct calculator_context  
    : proto::callable_context< calculator_context const >
{  
    std::vector<double> args;    

    // calculator_context "callable"，result_type
    typedef double result_type;    
    
    // Handle the placeholders
    template<int I>
    double operator()(proto::tag::terminal, placeholder<I>) const    
    {
        return this->args[I];    
    }
};

// grammar
struct calculator_grammar
    : proto::or_< proto::plus< calculator_grammar, calculator_grammar >
    , proto::minus< calculator_grammar, calculator_grammar >
    , proto::multiplies< calculator_grammar, calculator_grammar >
    , proto::divides< calculator_grammar, calculator_grammar >
    , proto::terminal< proto::_ >
    >
{};

// forward declare
template< typename Expr >
struct calculator;

// domain
struct calculator_domain
    : proto::domain< proto::pod_generator<calculator>, calculator_grammar >
{};

// extend calculator expression ( POD )
template< typename Expr >
struct calculator
{
    BOOST_PROTO_BASIC_EXTENDS(Expr, calculator<Expr>, calculator_domain)

    BOOST_PROTO_EXTENDS_SUBSCRIPT()
    BOOST_PROTO_EXTENDS_ASSIGN()

    typedef double result_type;

    // 通过calculator_context上下文对表达式执行计算
    result_type operator()( double d1 = 0.0, double d2 = 0.0 ) const
    {
        calculator_context ctx;

        ctx.args.push_back( d1 );
        ctx.args.push_back( d2 );

        return proto::eval(*this, ctx ); // 执行计算
    }
};

// statically initialized 编译时完成初始化
calculator< proto::terminal< placeholder<0> >::type > const _1 = {{{}}};
calculator< proto::terminal< placeholder<1> >::type > const _2 = {{{}}};

int main()
{
    double data[] = {1., 2., 3., 4.};
    std::transform( data, data + 4, data,  _1* _1 );
    std::copy( data, data+4, 
        std::ostream_iterator<double>( std::cout, " " ) );

    return 0;
}
{% endhighlight %}

输出：1  4  9  16

分析：  

1）、定义域  

~~~~
struct calculator_domain
    : proto::domain< proto::pod_generator<calculator>, calculator_grammar >
{};
~~~~

继承自proto::domain，需要用proto::generator包装表达式模板（模板的模板）作为首参数，如果需要是POD类型，则需要使用proto::pod_generator，并且可以指定语法，来限制表达式树的合法形式。

2）、扩展域中的表达式，定义行为，因而也需要定义相应的上下文  
对于非pod形式，可以直接使用`proto::extend<>`实现，如下：

{% highlight c++ %}
template< typename Expr >
struct calculator
    : proto::extends< Expr, calculator< Expr >, calculator_domain >
{
    typedef
        proto::extends< Expr, calculator< Expr >, calculator_domain >
        base_type;

    calculator( Expr const &expr = Expr() )
        : base_type( expr )
    {}

    // 引入extends<>::operator=
    BOOST_PROTO_EXTENDS_USING_ASSIGN(calculator)

    typedef double result_type;

    // 通过calculator_context上下文对表达式执行计算
    result_type operator()( double d1 = 0.0, double d2 = 0.0 ) const
    {
        calculator_context ctx;

        ctx.args.push_back( d1 );
        ctx.args.push_back( d2 );

        return proto::eval(*this, ctx ); // 执行计算
    }
};
{% endhighlight %}

但是由于继承的原因，`calculator<Expr>`不再是POD结构，不能静态初始化，只能运行时初始化：  
`calculator< proto::terminal< placeholder<0> >::type > const _1;`

其中的BOOST_PROTO_EXTENDS_USING_ASSIGN()宏，引入`extends<>::operator=`进入作用域，使得类似`_1 = 3;`这样的表达式有效，然而operator()不需要引入，因为我们会直接覆盖。

3）、保持表达式的POD性质  
通过继承自`proto::extends<>`，会导致扩展类型不再是POD结构，然而很多DSEL语法（domain- specific embedded languages）就要求能静态初始化的标识符，在任何运行时结构初始化之前就完成初始化。这样是非常有利，并且是安全的。
要实现保持POD的扩展，需要使用宏BOOST_PROTO_EXTENDS()，它其实包含了4部分内容：


|---
| 宏 | 作用
|-|:-|:-:|-:
| `BOOST_PROTO_BASIC_EXTENDS(expression, extension, domain)` | 必须定义的proto需要的表达式数据和内嵌typedefs；下面的三个宏，有需要时可以指定，或者直接由自己来定义。
| `BOOST_PROTO_EXTENDS_ASSIGN()` | 定义 operator=
| `BOOST_PROTO_EXTENDS_SUBSCRIPT()` | 定义 operator[] 
| `BOOST_PROTO_EXTENDS_FUNCTION()` | `定义operator()` 
| `BOOST_PROTO_EXTENDS(expression, extension, domain)` | 等价于上述4个宏


4）、关于ADL

proto中使用了大量的argument-dependent lookup（ADL），根据参数依赖来扩展符号的作用域（类域，名字空间等）。

比如：

{% highlight c++ %}
template<class T>
struct my_complex
{
    BOOST_PROTO_EXTENDS(
        typename proto::terminal<std::complex<T> >::type
        , my_complex<T>
        , proto::default_domain
        )
};

int main()
{
    my_complex<int> c0, c1;

    c0 + c1; // ERROR: operator+ not found
}
{% endhighlight %}

由于`my_complex<int>`与boost::proto没有任何联系，编译器找不到对应的operator+的定义。

可以通过这种默认模板的方式，引入名字空间proto：

{% highlight c++ %}
template<class T, class Dummy = proto::is_proto_expr>
struct my_complex
{
    BOOST_PROTO_EXTENDS(
        typename proto::terminal<std::complex<T> >::type
        , my_complex<T>
        , proto::default_domain
        )
};

int main()
{
    my_complex<int> c0, c1;

    c0 + c1; // OK, operator+ found now!
}
{% endhighlight %}

5）、关于表达式语法限制

上述的calculator_grammar定义了表达式的一个合法的子集，用于proto::domain的第二个模板参数，通过限制运算符重载，使得表达式限制在这个grammar之内。

比如，要限制一元的取地址符号：

~~~~
struct my_domain
    : proto::domain<
    proto::generator< my_wrapper >
    , proto::not_< proto::address_of< _ > > // 限制取地址符&的简单语法
    >
{};
~~~~

上述的`proto::not_< proto::address_of<_> >`能匹配所有的表达式，除了一元取地址符。


- **把现有类型加入到表达式的扩展**

在不改变现有类型定义的基础上，非嵌入式的将类型扩展为终结符表达式，是非常有意义的，proto允许我们通过简单的2个扩展达到这一目的，比如：

{% highlight c++ %}
#include <iostream>

#include <boost/mpl/bool.hpp>
#include <boost/proto/proto.hpp>

namespace mpl = boost::mpl;
namespace proto = boost::proto;

// math
namespace math
{
    struct matrix 
    {
        // ...
    };
}

// extend
namespace math
{
    template<typename T>
    struct is_terminal
        : mpl::false_
    {};

    template<>
    struct is_terminal<matrix>
        : mpl::true_
    {};

    BOOST_PROTO_DEFINE_OPERATORS(is_terminal, proto::default_domain)
}

int main()
{
    math::matrix m;
    m * proto::lit(5); // valid expression

    return 0;
}
{% endhighlight %}

通过一个traits的定义，然后用BOOST_PROTO_DEFINE_OPERATORS宏标识，在使用`m*proto::lit(5)`时，ADL查询到对应的定义，并根据traits决定是否要扩展生成对应的运算符重载。

- **消除重复代码的预处理器**

proto提供了一些宏来简化重复代码的书写，如：

- BOOST_PROTO_REPEAT
- BOOST_PROTO_REPEAT_FROM_TO
- BOOST_PROTO_REPEAT_EX  
- BOOST_PROTO_REPEAT_FROM_TO_EX

不过boost库有更加完善的预处理器库preprocessor，也非常规范，因此这里的proto辅助宏不是很有必要。


## 表达式自省与内部结构操作

### 初窥`expr<>`类型

例如：

~~~~
template<int I>
struct placeholder {};

proto::terminal<placeholder<0> >::type const _1 = {{}};
~~~~

_1的类型像这样：`proto::expr< proto::tag::terminal, proto::term< placeholder<0> >, 0 >`

尽管一般不需要直接处理`expr<>`类型，但事实上整个表达式树都是`expr<>`模板的方式积累起来的。

~~~~
template< typename Tag, typename Args, long Arity = Args::arity >
struct expr;
~~~~

- expr类型的第一个模板参数为Tag，表示节点的类型，前面例子中是个tag::terminal，因此_1是个叶子节点（leaf node）；
- 第二个参数为子节点类型的列表，但如果是terminal，则为叶子节点的值类型；
- 第三个参数为表达式的维度，叶子节点terminals为0，一元表达式为1等。

`proto::expr<>`结构本身，没有定义构造函数，以及其他会阻止它支持集合初始化（aggregate initialization）的东西。

集合初始化，使用” {} ”来表示一个初始化列表。比如上面的_1使用“{ {} }”来初始化，外层的{}对应expr<>结构，内层的{}对应于成员_1.child0，其类型为`placeholder<0>`，因为它也是aggregate的，支持{}来初始化。


### 关于表达式树构建

上面已经知道，表达式树都是以proto::expr<>类模板的基础上构建的，看个例子：

~~~~
typedef
    proto::expr<
        proto::tag::plus
        , proto::list2<
            proto::expr<
                proto::tag::terminal
                , proto::term< placeholder<0> >
                , 0
            > const &
            , proto::expr<
                proto::tag::terminal
                , proto::term< int const & >
                , 0
            >
        >
        , 2
    >
    placeholder_plus_int_type;

placeholder_plus_int_type y = _1 + 42;
~~~~

注意：  
1）、当proto表达式由其他子proto表达式组成时，它由引用方式持有，就算子表达式是个临时对象。（需要非常注意引用悬挂的问题），例如上面的_1子表达式是由const&方式作为外层`proto::expr<>`的子节点列表`list2<>`的首个元素。  
2）、非proto表达式，如整型常量42，会被包装成一个terminal，这个包装的`expr<>`没有用引用方式，但是被包装的类型则由引用方式const&持有。

总之：

1. 建立一个表达式树都是引用的方式建立的，不需要任何的拷贝。
2. 注意，上面的y将持有一个悬挂的引用持有临时对象int，这是非常危险的。不过通常，建立和执行表达式树都会在临时对象离开作用域前完成，悬挂引用的情况不多但是必须注意，
3. 另外，proto::deep_copy可以支持表达式树的叶子节点数据拷贝出来。


### 分析表达式内容

1）、tag和子节点维度

表达式树本身是递归的结构，每个节点都有一个tag类型，以及一个指代子节点的维度。

使用`proto::tag_of< Expr >::type`计算表达式Expr的tag类型；

使用`proto::arity_of<Expr>::value` 计算表达式EXpr的维度。

例如：

{% highlight c++ %}
template<typename Expr>
void check_plus_node(Expr const &)
{
    BOOST_STATIC_ASSERT((
        boost::is_same
        <
            typename proto::tag_of<Expr>::type
            , proto::tag::plus
        >::value
        ));

    BOOST_STATIC_ASSERT( proto::arity_of<Expr>::value == 2 );
}

check_plus_node( proto::lit(1) + 2 );
{% endhighlight %}

另外，对于表达式Expr，还有内嵌的类型Expr::proto_tag和Expr::proto_arity来获取tag类型和arity类型：

{% highlight c++ %}
template<typename Expr>
void check_plus_node(Expr const &)
{
    BOOST_STATIC_ASSERT((
        boost::is_same
        <
            typename Expr::proto_tag
            , proto::tag::plus
        >::value
        ));

    BOOST_STATIC_ASSERT( Expr::proto_arity::value == 2 );
}
{% endhighlight %}


2）、获取终结符的值

只有终结符（叶子节点）可以求值，使用函数`proto::value()`对终结符求值。

例如：

~~~~
proto::terminal<std::string>::type str = { "hello world" };
proto::value( str ); // “hello world”
~~~~

另外，可以使用`proto::result_of::value<Expr>`计算终结符的值类型，但是计算得到的值类型的cv属性与Expr的cv属性也相关；不过还可以使用`fusion::result_of::value_at<Expr, 0>::type`来计算真正的值类型。

假设值类型为T，则：


|---
| 元函数调用 | 结果
|-|:-|:-:|-:
| `proto::result_of::value<Expr>::type` | `typename boost::remove_const<typename boost::remove_reference<T>::type>::type` 
| `proto::result_of::value<Expr&>::type` | `typename boost::add_reference<T>::type`
| `proto::result_of::value<Expr const &>::type` | `typename boost::add_reference<typename boost::add_const<T>::type>::type`
| `fusion::result_of::value_at_c<Expr, 0>::type` | T

特别的，如果T是函数的引用，那么结果类型为T。

例如：

~~~~
template<typename Expr>
void CheckTerminal( Expr const& expr )
{
//  typedef typename fusion::result_of::value_at< Expr, mpl::int_<0> >::type ExprType;
    typedef typename fusion::result_of::value_at_c< Expr, 0 >::type ExprType;

    std::cout << typeid(ExprType).name() << "\n";
}

CheckTerminal( proto::lit(std::vector<int>(5, 0)) );
~~~~

输出：
~~~~
class std::vector<int,class std::allocator<int> >
~~~~

3）、获取子表达式

每个非终结节点都对应表达式中的一个运算符，而它的子节点对应于运算符的操作数或者运算符参数。

可以使用`proto::child_c<N>( expr )` 函数来获取表达式的子节点，以引用的方式返回。

对于子节点的类型，可以使用`proto::result_of::child_c<Expr, N>::type`来计算，默认计算得到的类型是去除cv属性的类型。不过对Expr加上cv属性，计算的类型也要相应的变化：


|---
| 元函数调用 | 子表达式类型 | 结果
|-|:-|:-:|-:
| `proto::result_of::child_c<Expr, N>::type` | T | `typename boost::remove_const<typename boost::remove_reference<T>::type>::type`
| `proto::result_of::child_c<Expr&, N>::type` | T | `typename boost::add_reference<T>::type`
| `proto::result_of::child_c<Expr const &, N>::type` | T | `typename boost::add_reference<typename boost::add_const<T>::type>::type`
| `fusion::result_of::value_at<Expr, N>::type` | T | T

4）、常用方法的简化

- 提供proto::child() 与 proto::left()，与`proto::child_c<0>()`等价
- 提供proto::right() 与 `proto::child_c<1>()`等价


### 深拷贝( Deep Copy )表达式

由于proto表达式是通过引用的方式构建起来的，拷贝子表达式就可能出现引用悬挂的问题，尽管子表达式的结构不容易直接写，但是：

1. 通过模板函数自动推断表达式类型进行推断，然后用`proto::result_of::child_c<Expr, N>::type`这样的方式可以方便的得到子表达式的类型。
2. 借助于类似auto、BOOST_TYPEOF()之类的自动推断类型。

例如：  
`auto ex = proto::lit(1) + 2;` // ex持有了悬挂的引用

可以使用proto::deep_copy()来导出表达式，使得所有的中间表达式和终结符节点，都通过值拷贝的方式（by value）构建新的表达式。如：  
`auto ex = proto::deep_copy( proto::lit(1) + 2 );`


### 打印表达式

针对可以输出的终结符类型，proto提供可打印表达式的函数，供调试，proto::display_expr()，这里不做介绍。


### Proto库运算符的Tag与相应元函数

下表列出了proto重载的C++运算符，每个运算符对应的tag，以及用于生成相应运算符表达式的元函数：


|---
| Operator | Proto Tag | Proto Metafunction
|-|:-|:-:|-:
| `unary +` | `proto::tag::unary_plus` | `proto::unary_plus<>` 
| `unary -` | `proto::tag::negate` | `proto::negate<>` 
| `unary *` | `proto::tag::dereference` | `proto::dereference<>` 
| `unary ~` | `proto::tag::complement` | `proto::complement<>` 
| `unary &` | `proto::tag::address_of` | `proto::address_of<>` 
| `unary !` | `proto::tag::logical_not` | `proto::logical_not<>` 
| `unary prefix ++` | `proto::tag::pre_inc` | `proto::pre_inc<>` 
| `unary prefix --` | `proto::tag::pre_dec` | `proto::pre_dec<>` 
| `unary postfix ++` | `proto::tag::post_inc` | `proto::post_inc<>` 
| `unary postfix --` | `proto::tag::post_dec` | `proto::post_dec<>` 
| `binary <<` | `proto::tag::shift_left` | `proto::shift_left<>` 
| `binary >>` | `proto::tag::shift_right` | `proto::shift_right<>` 
| `binary *` | `proto::tag::multiplies` | `proto::multiplies<>` 
| `binary /` | `proto::tag::divides` | `proto::divides<>` 
| `binary %` | `proto::tag::modulus` | `proto::modulus<>`
| `binary +` | `proto::tag::plus` | `proto::plus<>`
| `binary -` |  `proto::tag::minus` |  `proto::minus<>`
| `binary <  ` |   `proto::tag::less` |   `proto::less<> `
| `binary >  ` |   `proto::tag::greater` |    `proto::greater<> `
| `binary <= ` |   `proto::tag::less_equal` | `proto::less_equal<> `
| `binary >= ` |   `proto::tag::greater_equal` |  `proto::greater_equal<> `
| `binary == ` |   `proto::tag::equal_to` |   `proto::equal_to<> `
| `binary != ` |   `proto::tag::not_equal_to` |   `proto::not_equal_to<> `
| `binary || ` |   `proto::tag::logical_or` |  `proto::logical_or<> `
| `binary && ` |   `proto::tag::logical_and` |    `proto::logical_and<> `
| `binary &  ` |   `proto::tag::bitwise_and` |    `proto::bitwise_and<> `
| `binary |  ` |   `proto::tag::bitwise_or`  | `proto::bitwise_or<> `
| `binary ^  ` |   `proto::tag::bitwise_xor` |    `proto::bitwise_xor<> `
| `binary ,  ` |   `proto::tag::comma` |  `proto::comma<> `
| `binary ->*` |   `proto::tag::mem_ptr` |    `proto::mem_ptr<>`
| `binary =  ` |   `proto::tag::assign` | `proto::assign<>` 
| `binary <<=` |   `proto::tag::shift_left_assign`|   `proto::shift_left_assign<> `
| `binary >>=` |   `proto::tag::shift_right_assign` | `proto::shift_right_assign<> `
| `binary *= ` |   `proto::tag::multiplies_assign` |  `proto::multiplies_assign<> `
| `binary /= ` |   `proto::tag::divides_assign` | `proto::divides_assign<> `
| `binary %= ` |   `proto::tag::modulus_assign` | `proto::modulus_assign<> `
| `binary += ` |   `proto::tag::plus_assign`  |   `proto::plus_assign<> `
| `binary -= ` |   `proto::tag::minus_assign` |   `proto::minus_assign<> `
| `binary &= ` |   `proto::tag::bitwise_and_assign` | `proto::bitwise_and_assign<> `
| `binary |= ` |   `proto::tag::bitwise_or_assign` |  `proto::bitwise_or_assign<> `
| `binary ^= ` |   `proto::tag::bitwise_xor_assign` | `proto::bitwise_xor_assign<> `
| `binary subscript`  |  proto::tag::subscript` |  `proto::subscript<> `
| `ternary ?:` | `proto::tag::if_else_` |   `proto::if_else_<> `
| `n-ary function call` |  `proto::tag::function` |   `proto::function<>`


### 表达式树作为fusion的序列

本质上，proto表达式是子表达式的组织起来的结构，是fusion的合法的随机访问序列或者二叉树，因此可以应用使用fusion的算法操作表达式。

- 例如（打印lazy函数调用的参数列表）：

{% highlight c++ %}
#include <iostream>

#include <boost/proto/proto.hpp>
#include <boost/fusion/algorithm.hpp>

namespace proto = boost::proto;
namespace fusion = boost::fusion;

struct display
{
    template<typename T>
    void operator()(T const &t) const
    {
        std::cout << t << std::endl;
    }
};

struct fun_t {};
proto::terminal<fun_t>::type const fun = {{}};

int main()
{
    fusion::for_each(
        fusion::transform( 
            fusion::pop_front(fun(1,2,3,4)) // 将首节点fun弹出，剩下1 2 3 4
            , proto::functional::value())   // 取list4<>中的终结符的值
        , display() 
        );

    return 0;
}
{% endhighlight %}

输出：  
1  
2  
3  
4

注意：

1. 表达式fun(1,2,3,4)对应于fusion的序列；fusion::transform(seq, f); 得到新序列，每个元素是f作用于元序列的对应元素f(e)
2. fusion::for_each(seq, f); 对序列的每个元素调用f(e)

- 打印一个加法表达式的节点

由于加法表达式是一个二叉树结构，并不是一个简单的序列，如果需要访问表达式的各节点，需要使用proto::flatten()使得表达式成为平滑的序列。

例如：

{% highlight c++ %}
#include <iostream>

#include <boost/proto/proto.hpp>
#include <boost/fusion/algorithm.hpp>

namespace proto = boost::proto;
namespace fusion = boost::fusion;

struct display
{
    template<typename T>
    void operator()(T const &t) const
    {
        std::cout << t << std::endl;
    }
};

proto::terminal<int>::type const _1 = {1};

int main()
{
    fusion::for_each(
        fusion::transform( 
        proto::flatten( _1 + 2 + 3 )
            , proto::functional::value())
        , display() 
        );

    return 0;
}
{% endhighlight %}

输出：  
1  
2  
3


### 表达式语法

proto可以支持语法模式的定义来约束表达式的格式。

1、找到表达式的模式

proto提供了一些实用工具来定义语法，并支持使用`proto::matched<>`模板来检查是否给定的表达式匹配语法。

比如：

{% highlight c++ %}
#include <iostream>

#include <boost/proto/proto.hpp>
namespace proto = boost::proto;

proto::terminal< std::istream & >::type cin_    = { std::cin };
proto::terminal< std::ostream & >::type cout_   = { std::cout };

struct Input
    : proto::shift_right< proto::terminal< std::istream & >, proto::_ >
{};

struct Output
    : proto::shift_left< proto::terminal< std::ostream & >, proto::_ >
{};

template< typename Expr >
void input_output( Expr const & expr )
{
    if( proto::matches< Expr, Input >::value )
    {
        std::cout << "Input!\n";
    }

    if( proto::matches< Expr, Output >::value )
    {
        std::cout << "Output!\n";
    }
}

int main()
{
    int i = 0;
    input_output( cout_ << 1 );
    input_output( cin_ >> i );

    return 0;
}
{% endhighlight %}

输出：  
Output!  
Input!  

2、递归的表达式模式

对于上面的例子，如果使用`input_output( cout_ << 1 << 2 );` 将不满足Output语法，因为：  
`cout_ << 1 << 2`，等价于 `( cout_ << 1 ) << 2`，它要求左操作符本身是一个`<<`运算符表达式。

为了符合使表达式符合语法，必须递归的处理bottom-left-most的叶子节点。

可以使用`proto::or_<>`来表达多个选择，语法表达式如下：

{% highlight c++ %}
struct Output
    : proto::or_<
        proto::shift_left< proto::terminal< std::ostream & >, proto::_ >
        , proto::shift_left< Output, proto::_ >
    >
{};
{% endhighlight %}

这是递归的语法，语法的定义依赖于本身，因为它们就是来匹配递归的结构的。

`(cout_ << 1) << 2`的匹配Output的过程如下：

1. `proto::or_<>`的第一个语法先尝试，将失败，因为它不符合`proto::shift_left<>`语法
2. 然后第二个语法尝试，表达式是`<<`运算符表达式，符合`proto::shift_left< Output, proto::_ >`，接着需要匹配操作数。
3. 右操作数2显然匹配proto::_
4. 接下来判断`cout_ << 1`是否匹配Output。这次是递归的计算Output语法，它符合`proto::or_<>`的第一个语法。

3、关于终结符语法的模糊与精确匹配

终结符语法默认是模糊匹配的，`proto::terminal<int>`可以匹配`int, int&, int const&`。

但是如果给`terminal<>`的模板参数指定cv类型，那么将是精确匹配。

即：

~~~~
proto::terminal<T>      可以匹配：T, T&, T const&
proto::terminal<T&>     可以匹配：T&
proto::terminal<T const&>   可以匹配：T const&
~~~~

- 另外，为了可以精确的匹配T，proto提供了`proto::exact<>`来实现不带cv类型的精确匹配。这样，`proto::terminal< proto::exact<int> >`只能匹配int
- 对于数组类型的匹配，proto也提供的特别的支持，例如：

proto::as_expr(“hello”) 除了可以匹配`proto::terminal< char const[6] >`以外，还可以匹配`proto::terminal<char const*>`，即：

~~~~
typedef proto::terminal< char const[6] >::type char_array;
BOOST_MPL_ASSERT(( proto::matches< char_array, proto::terminal< char const * > > ) );
~~~~

静态Assert可以通过，注意不带::type的terminal作为语法，而带::type的terminal则为对应的终结符表达式类型。

- 也可以强制匹配字符指针类型，`proto::terminal< proto::exact< char const * > >`将只能匹配`proto::terminal<char const *>::type`，而无法匹配`proto::terminal<char const[6]>::type`。
- 匹配任意长度的数组类型，需要使用proto::N，如`proto::terminal< char const [ proto::N ] >`将匹配所有的字符串字面值（string literal）。
- 匹配可转化的终结符，需要使用`proto::convertible_to<>`，如：`proto::terminal< proto::convertible_to<double> >`可以匹配能转化为double的值类型的终结符。
- 使用`proto::_`除了可以匹配任意的终结符外，还可以作为模板参数表示该模板参数可以为任意类型，如：`proto::terminal< std::complex< proto::_ > >`可以匹配`proto::terminal< std::complex<int> >`等。


4、`if_<>、and_<>、not_<>`

- `proto::not_<>` 

使用一个语法grammar作为模板参数，并且逻辑上否定它，匹配除此之外的语法。

- `proto::if_<>` 

使用最多3个语法转换（transform）作为模板参数，参数分别是Condition、ThenExpr、ElseExpr。
比如：

~~~~
struct CharString
    : proto::and_<
        proto::terminal< proto::_ >
        , proto::if_< boost::is_same< proto::_value, char const * >() >
    >
{};
~~~~

注意：`boost::is_same< proto::_value, char const * >()`是一个对象转换。


`proto::if_<>` 转换支持多种语法：`if_<Condition>` 、`if_<Condition, ThenGrammar>` ，以及`if_<Condition, ThenGrammar, ElseGrammar>`。

- `proto::and_<>` 

使用与`proto::or_<>`类似，但是语义上要求匹配所有的语法模板参数。


5、使用`switch_<>`来提高编译效率

如果语法规则过多，使用`proto::or_<>`会受到模板参数的数目限制问题（BOOST_PROTO_MAX_LOGICAL_ARITY宏），更长的编译时间问题，以及子表达式的按序判断，导致过多的实例化。

对于这种情况，推荐使用：`proto::switch<>`

- 将一个`proto::or_<>`实现的语法 翻译成 `proto::switch_<>`实现的语法：

{% highlight c++ %}
struct ABigGrammar
    : proto::or_<
    proto::terminal<int>
    , proto::terminal<double>
    , proto::unary_plus<ABigGrammar>
    , proto::negate<ABigGrammar>
    , proto::complement<ABigGrammar>
    , proto::plus<ABigGrammar, ABigGrammar>
    , proto::minus<ABigGrammar, ABigGrammar>
    , proto::or_<
        proto::multiplies<ABigGrammar, ABigGrammar>
        , proto::divides<ABigGrammar, ABigGrammar>
        , proto::modulus<ABigGrammar, ABigGrammar>
        >
    >
{};
{% endhighlight %}

注意到，由于超过了8个子语法的模板参数，需要使用嵌套的`proto::or_<>`来链接子语法。

`proto::switch_<>`的实现，依赖于基于表达式tag的分派，针对不同的tag，case_不同的语法：

{% highlight c++ %}
// 前置声明
struct ABigGrammar;

struct ABigGrammarCases
{
    // 原始case_模板类
    template<typename Tag>
    struct case_
        : proto::not_<proto::_> // 默认 matches nothing
    {};
};

// 各种tag对应的语法的case_
template<>
struct ABigGrammarCases::case_<proto::tag::terminal>
    : proto::or_< // 同样的tag下的多种情况用or_串起来
    proto::terminal<int>
    , proto::terminal<double>
    >
{};

template<>
struct ABigGrammarCases::case_<proto::tag::unary_plus>
    : proto::unary_plus<ABigGrammar>
{};

template<>
struct ABigGrammarCases::case_<proto::tag::negate>
    : proto::negate<ABigGrammar>
{};

template<>
struct ABigGrammarCases::case_<proto::tag::complement>
    : proto::complement<ABigGrammar>
{};

template<>
struct ABigGrammarCases::case_<proto::tag::plus>
    : proto::plus<ABigGrammar, ABigGrammar>
{};

template<>
struct ABigGrammarCases::case_<proto::tag::minus>
    : proto::minus<ABigGrammar, ABigGrammar>
{};

template<>
struct ABigGrammarCases::case_<proto::tag::multiplies>
    : proto::multiplies<ABigGrammar, ABigGrammar>
{};

template<>
struct ABigGrammarCases::case_<proto::tag::divides>
    : proto::divides<ABigGrammar, ABigGrammar>
{};

template<>
struct ABigGrammarCases::case_<proto::tag::modulus>
    : proto::modulus<ABigGrammar, ABigGrammar>
{};

// 通过ABigGrammarCases的case_，proto::switch_定义ABigGrammar
struct ABigGrammar
    : proto::switch_<ABigGrammarCases>
{};

// 验证
BOOST_STATIC_ASSERT( (proto::matches< proto::terminal<int>::type, ABigGrammar >::value) );

BOOST_STATIC_ASSERT( (! proto::matches< proto::terminal<float>::type, ABigGrammar >::value) );
{% endhighlight %}

注意：  
`proto::switch_<C>`等价于匹配`C::case_< E::proto_tag >`，通过对tag的模板特化直接实现对于的子语法，如果不存在特化，则使用默认的`case_<>`主模板语法。

6、匹配多参数表达式（函数调用表达式）

并不是所有的运算符表达式都是一元或者两元的，函数调用运算符operator()就是可以是任意数量的参数。

Proto提供了`proto::vararg<>`来匹配这类N元语法，`proto::vararg<>`的模板参数是一个语法，根据函数调用运算符的参数数量，它将匹配参数0次或多次。

例如：

{% highlight c++ %}
#include <boost\fusion\container.hpp>
#include <boost/proto/proto.hpp>
using namespace boost;

struct fun_tag {};
struct FunTag : proto::terminal< fun_tag > {};
FunTag::type const fun = {{}};

// 函数调用的参数的语法匹配
struct ArgType 
    : proto::or_<
    proto::terminal< char >,
    proto::terminal< int >
    >
{};

// 函数调用的语法：使用proto::vararg<>
struct FunCall
    : proto::function< FunTag, proto::vararg< ArgType > >
{};

template<typename Expr>
void CheckTerminal( Expr const& expr )
{
    BOOST_STATIC_ASSERT( ( proto::matches<Expr, FunCall>::value ) );
}

int main()
{
    CheckTerminal( fun('a', 5) );

    return 0;
}
{% endhighlight %}

注意：`proto::vararg<>`的模板参数本身也是语法，用来匹配函数调用表达式的参数。

再比如：

{% highlight c++ %}
struct MatchAnyExpr
    : proto::or_<
    proto::terminal< proto::_ >
    , proto::nary_expr< proto::_, proto::vararg< MatchAnyExpr > >
    >
{};
{% endhighlight %}

其中，`proto::nary_expr<>`用于生产任意N元表达式：

~~~~
template<typename Tag, typename Arg>
struct unary_expr;

template<typename Tag, typename Left, typename Right>
struct binary_expr;

template<typename Tag, BOOST_PP_ENUM_PARAMS_WITH_A_DEFAULT(BOOST_PROTO_MAX_ARITY, typename A, void)>
struct nary_expr;
~~~~

特别的，unary_expr是一元的，binary_expr是二元的。  
`proto::nary_expr<>`的第一个模板参数代表表达式的tag，接下来的参数表示表达式的子节点，可以看到上面的MatchAnyExpr可以匹配任意的语法。


7、综合设计DSEL的语法

要实现嵌入C++的语言，首先要明确该语言的EBNF语法范式，然后针对语法组织proto的grammar。

比如一个支持最多两个占位符的计算器表达式框架的EBNF范式：

~~~~
group           ::=  '(' expression ')'
factor          ::=  double | '_1' | '_2' | group
term        ::=  factor (('*' factor) | ('/' factor))*
expression      ::=  term (('+' term) | ('-' term))*
~~~~

其中，group子语法是C++默认就有的语法功能，不需要再额外处理，这样：

~~~~
expression =  factor  ->  ( double | _1 |2 )
            | expressive + expressive
            | expressive – expressive
            | expressive * expressive
            | expressive / expressive
            | ( expressive ) -> 不需要处理
~~~~

语法的代码：

{% highlight c++ %}
#include <boost\fusion\container.hpp>
#include <boost/proto/proto.hpp>
using namespace boost;

template<int N>
struct placeholder {};

static const proto::terminal< placeholder<0> >::type _1 = {{}};
static const proto::terminal< placeholder<1> >::type _2 = {{}};

// 语法前置声明
struct CalculatorGrammar;

// 基本因子
struct factor 
    : proto::or_<
    proto::terminal< proto::convertible_to<double> >,
    proto::terminal< placeholder<0> >,
    proto::terminal< placeholder<1> >
    >
{};

// 表达式
struct CalculatorGrammar 
    : proto::or_<
    factor,
    proto::plus<CalculatorGrammar, CalculatorGrammar>,
    proto::minus<CalculatorGrammar, CalculatorGrammar>,
    proto::multiplies<CalculatorGrammar, CalculatorGrammar>,
    proto::divides<CalculatorGrammar, CalculatorGrammar>
    >
{};

template<typename Expr>
void CheckTerminal( Expr const& expr )
{
    BOOST_STATIC_ASSERT( ( proto::matches<Expr, CalculatorGrammar>::value ) );
}

int main()
{
    CheckTerminal( (_1 + 6) / _2  );
    return 0;
}
{% endhighlight %}


## 操纵表达式行为

前面的表达式都是DSEL编译器的前端，接下来要操纵表达式的行为。

有两种方式可以计算和操纵表达式：上下文（context）和转换（transform）。

- context：是配合函数proto::eval()使用的，将节点与行为关联，是一种比较简单的方式。当proto::eval()计算表达式时，遍历每个节点，都需要关联上context才能计算得到对应的行为。context就像是真正执行计算的函数对象，而函数proto::eval()只是转调用context对应的行为。
- transform：也是关联表达式的行为，但是不是通过节点与行为关联，而是将行为与proto语法相关联，这样他的行为就像编译器组件中的语义动作。


### context控制表达式行为

1、函数proto::eval()

通过proto的运算符或者proto::make_expr()函数建立了表达式后，需要执行计算才有意义。最简单的计算方式是使用proto::eval()，为了使用proto::eval()，需要提供一个context，它用来告诉proto::eval()怎么来计算每个节点。

注：比起transfrom，proto是一种使用简单，但不是很强大的计算方式。目前的proto::eval()遍历树的算法不是很高效，到时候proto的遍历树算法可能会新做一套，那时proto::eval()计算方式将被替代。

proto::eval相关的代码：

{% highlight c++ %}
namespace proto
{
    namespace result_of
    {
        // proto::eval( expr, ctx )计算的返回值类型计算
        template<typename Expr, typename Context>
        struct eval
        {
            typedef
                typename Context::template eval<Expr>::result_type
                type;
        };
    }

    namespace functional
    {
        // A callable function object type for evaluating
        // a Proto expression with a certain context.
        struct eval : callable
        {
            template<typename Sig>
            struct result;

            template<typename Expr, typename Context>
            typename proto::result_of::eval<Expr, Context>::type
                operator ()(Expr &expr, Context &context) const;

            template<typename Expr, typename Context>
            typename proto::result_of::eval<Expr, Context>::type
                operator ()(Expr &expr, Context const &context) const;
        };
    }

    // proto::eval()函数的实现
    template<typename Expr, typename Context>
    typename proto::result_of::eval<Expr, Context>::type
    eval(Expr &expr, Context &context)
    {// 转调用了context的成员模板类，该类型是函数对象
        return typename Context::template eval<Expr const>()(e, ctx);
    }

    template<typename Expr, typename Context>
    typename proto::result_of::eval<Expr, Context>::type
    eval(Expr &expr, Context const &context)
    {
        return typename Context::template eval<Expr const>()(e, ctx);
    }
}
{% endhighlight %}

可以看到proto::eval()基本上只是个代理，它的实现转调用了context的成员模板类`Context::template eval<Expr const>`，该成员模板类本身是个函数对象，接受expr和ctx参数。所以，只要对context的eval成员模板类特化各种节点的处理情况即可。

当我们定义了自己的context，可以简单的使用了：

{% highlight c++ %}
template<typename Expr>
typename proto::result_of::eval<Expr const, MyContext>::type
MyEvaluate(Expr const &expr)
{
    MyContext ctx;
    return proto::eval(expr, ctx);
}
{% endhighlight %}

2、定义context

上面看到了proto::eval()根本没什么内容，其实所有的计算细节都在context。

{% highlight c++ %}
// 用户定义的context格式
struct MyContext
{
    // 内嵌eval<> 类模板
    template<
        typename Expr
        , typename Tag = typename proto::tag_of<Expr>::type
    >
    struct eval;

    // 特化：处理终结符
    template<typename Expr>
    struct eval<Expr, proto::tag::terminal>
    {
        // 必须有内嵌的result_type的typedef，标示返回值类型
        typedef ... result_type;

        // 必须重载operatot()，并且参数是expr和ctx
        result_type operator()(Expr &expr, MyContext &ctx) const
        {
            return ...;
        }
    };

    // 特化struct eval<>处理其他类型的节点
};
{% endhighlight %}

可以看出，context其实是一系列内嵌类模板`eval<>`的各种特化的集合，每种特化处理对于的节点类型。

例子：

{% highlight c++ %}
#include <iostream>
#include <vector>

#include <boost/proto/proto.hpp>
namespace proto = boost::proto;

template<int N>
struct placeholder {};

proto::terminal< placeholder<0> >::type _1 = {{}};
proto::terminal< placeholder<1> >::type _2 = {{}};

// 自定义的context
struct calculator_context
{
    std::vector<double> args;

    template
    <
        typename Expr
        , typename Tag = typename proto::tag_of<Expr>::type
    >
    struct eval;

    // 处理terminals
    template<typename Expr>
    struct eval<Expr, proto::tag::terminal >
    {
        typedef double result_type;

        // 处理不同类型的terminal的辅助类
        template
        <
            typename TerminalExpr
            ,typename Arg0 = typename proto::result_of::value<TerminalExpr>::type 
        >
        struct HandleTerminal
        {// 默认实现，直接取对应的值
            static result_type eval(Expr & e, calculator_context &ctx)
            {
                return proto::child(e);
            }
        };

        template<typename TerminalExpr, int I>
        struct HandleTerminal< TerminalExpr, placeholder<I> >
        {// 类型为terminal< placeholder<I> >::type的
            static result_type eval(Expr &, calculator_context &ctx)
            {
                return ctx.args[I];
            }
        };

        // operator()
        result_type operator()(Expr & e, calculator_context &ctx) const
        {
            return HandleTerminal<Expr>::eval(e, ctx);
        }
    };

    // 加法
    template<typename Expr>
    struct eval<Expr, proto::tag::plus>
    {
        typedef double result_type;

        result_type operator()(Expr &expr, calculator_context &ctx) const
        {
            return proto::eval(proto::left(expr), ctx)
                + proto::eval(proto::right(expr), ctx);
        }
    };
};

int main()
{
    calculator_context ctx;
    ctx.args.push_back(5);
    ctx.args.push_back(6);
    double d = proto::eval(_1 + _2 + 10, ctx);
    std::cout << d << std::endl;

    return 0;
}
{% endhighlight %}

输出：21


3、proto内建的context

proto提供了一些辅助类来简化自定义context的书写。

- default_context：赋予运算符通常的C++语义，比如，加法运算符对应行为是先计算左右儿子节点，然后将两个值相加。
- null_context：只遍历的计算表达式，但是不合并子表达式的结果，返回void
- `callable_context<>`：简化自定义context的方式，不需要再进行一系列成员类模板`eval<>`的特化，只需要定义一些重载的operator()。

1）、default_context

简单的例子：

{% highlight c++ %}
#include <iostream>
#include <boost/proto/proto.hpp>
#include <boost/proto/context.hpp>
#include <boost/typeof/std/ostream.hpp>
using namespace boost;

proto::terminal< std::ostream & >::type cout_ = { std::cout };

template< typename Expr >
void evaluate( Expr const & expr )
{
    proto::default_context ctx;
    proto::eval(expr, ctx);
}

int main()
{
    // 使用default_context
    evaluate( cout_ << "hello" << ',' << " world" );
    return 0;
}
{% endhighlight %}

输出：hello, world

default_context的实现：

{% highlight c++ %}
struct default_context
{
    template<typename Expr>
    struct eval
        : default_eval<
        Expr
        , default_context const
        , typename tag_of<Expr>::type
        >
    {};
};
{% endhighlight %}

proto实现了一系列`default_eval<>`的特化，用以处理每种运算符，比如加法：

{% highlight c++ %}
template<typename Expr, typename Context>
struct default_eval<Expr, Context, proto::tag::plus>
{
private:
    static Expr    & s_expr; // 静态引用，引用于计算返回类型
    static Context & s_ctx;

public:
    // 计算返回类型
    typedef
        decltype(
        proto::eval(proto::child_c<0>(s_expr), s_ctx)
        + proto::eval(proto::child_c<1>(s_expr), s_ctx)
        )
        result_type;

    result_type operator ()(Expr &expr, Context &ctx) const
    {// 计算左右子表达式，然后使用operator+
        return proto::eval(proto::child_c<0>(expr), ctx)
            + proto::eval(proto::child_c<1>(expr), ctx);
    }
};
{% endhighlight %}

2）、null_context

仅递归的计算表达式，但不对计算值做处理。实现：

{% highlight c++ %}
struct null_context
{
    template<typename Expr>
    struct eval
        : null_eval<Expr, null_context const, Expr::proto_arity::value>
    {};
};

// 不同维度的arity的特化
// Binary null_eval<>
template<typename Expr, typename Context>
struct null_eval<Expr, Context, 2>
{
    typedef void result_type;

    void operator()(Expr &expr, Context &ctx) const
    {
        proto::eval(proto::child_c<0>(expr), ctx);
        proto::eval(proto::child_c<1>(expr), ctx);
    }
};
{% endhighlight %}

null_context由于行为是不处理对应的表达式，这样常可以作为默认情况，不处理表达式，然后特化某些处理表达式的情形，常用于辅助callable_context。


3）、callable_context

{% highlight c++ %}
#include <iostream>
#include <vector>

#include <boost/proto/proto.hpp>
namespace proto = boost::proto;

struct increment_ints
    : proto::callable_context<
    increment_ints const
    , proto::null_context const     // 未重载情况的默认实现
    >
{
    typedef void result_type;

    // 处理int类型的terminal
    void operator()(proto::tag::terminal, int &i) const
    {
        ++i;
    }
};

int main()
{
    proto::literal<int> i = 0, j = 10;
    proto::eval( i - j * 3.14, increment_ints() );
    
    std::cout << "i = " << i.get() << std::endl;
    std::cout << "j = " << j.get() << std::endl;

    return 0;
}
{% endhighlight %}

输出：  
i = 1  
j = 11

注意：`proto::callable_context<>`带两个模板参数：待实现的context 和 fallback默认情况。
针对节点，callable_context会检查是否存在合适的operator()重载，然后选择对应的调用，注意不同tag对应维度的operator()的定义。

- 终结符维度0，调用：`context( tag::terminal(), proto::value(expr) )`

- 其他维度（注：context是仿函数）：

~~~~
context(
    typename Expr::proto_tag(),
  , proto::child_c<0>(expr)
  , proto::child_c<1>(expr)
    ...
);
~~~~

之前自定义的calculator_context也可以简化：

{% highlight c++ %}
struct calculator_context
    : proto::callable_context< calculator_context const >
{// 第二个模板参数使用了proto::default_context
    std::vector<double> args;

    typedef double result_type;

    // Handle placeholders:
    template<int I>
    double operator()(proto::tag::terminal, placeholder<I>) const
    {
        return this->args[I];
    }
};
{% endhighlight %}


### 转换transform 

与boost.spirit的语义动作类似，让语法被识别时嵌入相应的行为（计算得到需要的值），在proto中被称为transform。

1、为语法grammar添上处理行为transform

之前定义的语法都是静态的类型，没有运行时的行为，给语法嵌入转换，将在语法匹配的过程中执行对应的嵌入动作，例如：

~~~~
proto::when<
    proto::terminal< _ >    // 语法：匹配任意一个终结符
    , proto::_value         // 转换：返回终结符的值
>
~~~~

这段内容可读性很强，即：当遇到终结符时，取它的值。

`proto::when<>`的第一个模板参数是需要匹配的语法，第二个是要执行的转换。而结果是兼有两者的行为：一个用于匹配终结符的语法和一个接收终结符作为参数的函数对象。

例子：

{% highlight c++ %}
#include <iostream>
#include <boost/proto/proto.hpp>
using namespace boost;

// 接受终结符并计算其值的函数对象
struct GetValue 
    : proto::when< 
    proto::terminal< proto::_ >
    , proto::_value
    >
{};

int main()
{
    proto::literal<int> i = 10;

    GetValue get_value;
    std::cout << get_value( i ) << std::endl; // 10

    return 0;
}
{% endhighlight %}

另外，转换( transform )是符合函数对象标准的（内嵌返回值类型result_type），可以通过`boost::result<>`标准方法获取转换的返回类型：

~~~~
typedef
    typename boost::result_of<GetValue(proto::terminal<int>::type)>::type
    result_type;
~~~~


2、处理语法次序和递归

比如要获取表达式树的最左下终结符的值：

{% highlight c++ %}
#include <iostream>
#include <boost/proto/proto.hpp>
using namespace boost;

struct LeftmostLeaf
    : proto::or_<
    proto::when<    // 先处理特殊的：终结符
        proto::terminal< proto::_ >
        , proto::_value
    >
    , proto::when<  // 其他（非终结符）：递归处理左子树
        proto::_
        , LeftmostLeaf( proto::_child0 )
    >
    >
{};

int main()
{
    proto::literal<int> n = 6;
    int& v = LeftmostLeaf() ( (n + 10) / 2 ); // 6

    return 0;
}
{% endhighlight %}

3、可调用转换（Callable Transforms）

上面处理非终结符的部分：

~~~~
proto::when< 
    proto::_
    , LeftmostLeaf( proto::_child0 ) // 可调用转换
>
~~~~

它能接受非终结符表达式，取其左子树来递归的调用LeftmostLeaf。

分析：

1. `LeftmostLeaf( proto::_child0 )` 本身是个函数签名的语法，然后事实上是不会有这个签名的函数的。
2. 关键在于`proto::when<>`是如何解释第二个模板参数的，当第二个模板参数是函数签名时，`proto::when<>`将其解释为转换，其中LeftmostLeaf看作是要调用的函数对象，而签名的参数`proto::_child0`被作为转换。首先，proto::_child0应用到当前表达式得到左子树，得到的左子树再被作为LeftmostLeaf的参数，继而形成了递归。
3. Transform的实现本身就是嵌入C++的语言，这其实也是DESL的嵌入C++语法的实现例子，它使用的函数签名的语法，因为这种语法可读性很好，很自然简明。


4、对象转换（Object Transforms）

转换语法中的函数签名，除了可调用转换外，还可以是对象转换，例如：

~~~~
proto::when<
    proto::terminal< int >
    , long(proto::_value)     // "object" transform
>
~~~~

当匹配到`terminal<int>`的终结符时，取它的值来初始化一个long值。

总之，对象转换是`object( arg_transforms )`，先执行arg_transforms的计算，得到的结果来初始化一个对象object。

- 计算表达式的维度例子：

|---
| 子表达式 | 维度
|-|:-|:-:|-:
| Placeholder 1 | 1
| Placeholder 2 |  2 
| Literal   |  0 
| Unary Expression  |  操作符的维度
| Binary Expression |  两个操作符中维度大的

{% highlight c++ %}
#include <iostream>
#include <boost/proto/proto.hpp>
#include <boost/mpl/max.hpp>
using namespace boost;

using proto::_;

template<int I>
struct placeholder {};

struct CalcArity
    : proto::or_<
        proto::when< 
            proto::terminal< placeholder<0> >,
            mpl::int_<1>()  // 退化情况，不带参数对象转换
        >
        , proto::when< 
            proto::terminal< placeholder<1> >,
            mpl::int_<2>()
        >
        , proto::when< 
            proto::terminal<_>,
            mpl::int_<0>()
        >
        , proto::when< 
        proto::unary_expr<_, CalcArity>, // 任意的一元表达式，递归的语法
        CalcArity(proto::_child)
        >
        , proto::when< 
            proto::binary_expr<_, CalcArity, CalcArity>,
            mpl::max<CalcArity(proto::_left), CalcArity(proto::_right)>()
        >
    >
{};

proto::terminal< placeholder<0> >::type _1 = {{}};
proto::terminal< placeholder<1> >::type _2 = {{}};

int main()
{
    // 计算结果对象
    /*int*/ mpl::int_<2> v = CalcArity() ( _1 + _2 );
    std::cout << v << std::endl; // 2
    return 0;
}
{% endhighlight %}

注意：  
`mpl::max<CalcArity(proto::_left), CalcArity(proto::_right)>()`
这个转换总体上是个对象转换`mpl::max<…>( sub_transforms )`，原本`mpl::max<>`元函数接受两个编译器常整数，然后通过内嵌的::type计算两者中较大的常整数，在这里的模板参数是可调用转换，不过proto会先计算内嵌的转换，将常整型结果作为`mpl::max<>`的模板参数，最后来进行对象的构造。

总之，proto检查对象转换时，会看是否是模板特化，如果是模板特化会继续检查是否有内嵌的转换，当所有内嵌的转换都执行完了以后再来实例化得到最终的模板特化。


5、带状态折叠( fold )的转换

之前我们使用转换（transform）时都只带一个表达式参数，其实转换还可以带一个可选的状态（state）参数，表达式树上的每个节点都有对应的状态。因而可以通过子表达式的状态来积累变化来折叠得到整个表达式的状态。

- 之前使用的基元转换proto::_value接受一个终结符，并返回它的值，其实它也接受状态，只不过是简单的忽略；
- 现在需要引入取状态的基元转换proto::_state，它接受当前表达式的状态并返回，对于表达式参数部分直接忽略。最后调用时，需要提供一个初始的状态。

例如（将输出表达式的参数存到列表中）：

{% highlight c++ %}
#include <boost/proto/proto.hpp>
#include <boost/fusion/container.hpp>
using namespace boost;

#include <iostream>
#include <string>
using namespace std;

// 带状态累计的变换
struct FoldToList
    : proto::or_
    <
        proto::when
        <// ostream的终结符直接忽略
            proto::terminal< std::ostream & > 
            , proto::_state
        >
        , proto::when
        <//  将其它所有终结符放在我们正在"state"参数中构建的链表的头部
            proto::terminal<proto::_> 
            , fusion::cons<proto::_value, proto::_state>( 
                proto::_value, proto::_state )
        >
        , proto::when
        <
            // 对于左移操作，首先将右子节点与当前state折叠到一个链表中。       
            // 然后再将左子节点折叠至链表时，把该结果作为state参数。
            proto::shift_left<FoldToList, FoldToList>
            , FoldToList( proto::_left, 
                proto::call< FoldToList(proto::_right, proto::_state) > )
        >
    >
{};

int main()
{
    proto::terminal< ostream & >::type cout_ = { cout };

    typedef fusion::cons<
        int, fusion::cons<
        double, fusion::cons<
        string, 
        fusion::nil > > > result_type;

    // fusion::nil()初始状态
    result_type args = 
        FoldToList()( cout_ << 1 << 3.14 << std::string("hello"), fusion::nil() ); 

    cout << fusion::at_c<0>( args ) << endl;
    cout << fusion::at_c<1>( args ) << endl;
    cout << fusion::at_c<2>( args ) << endl;

    return 0;
}
{% endhighlight %}

输出：  
1  
3.14  
hello  

分析：

1. 调用使用了状态参数fusion::nil()，标识初始状态。
2. 遇到除了`terminal<ostream&>`外的终结符时，状态使用了`fusion::cons<proto::_value, proto::_state>( proto::_value, proto::_state )`其实这是个对象转换，可以看到proto对于模板特化的对象转换的智能程度，proto::_value, proto::_state，既作为模板参数，又作为对象转换签名的参数。总之，再强调下，transform的实现本身是DESL，签名被proto当成转换的语法，内部实现对模板特化的对象转化做了全面的支持，使用者只需要知道这样的语法是可以的即可。
3. 对于`operator<<`，使用了递归的转换，语义是很明确的，但是由于MSVC的问题，函数参数的调用需要用`proto::call<>`来包装。

原本是要这样写即可：  
`FoldToList(proto::_left, FoldToList(proto::_right, proto::_state))`


6、向转换传递辅助数据

除了向转换传递累积变化的状态之外，还可以向转换传递额外的数据参数data，作为签名的第三个参数。

注：proto语法作为函数对象，最多可以接受3个参数：表达式(expression)、状态(state)、数据(data)。

{% highlight c++ %}
#include <iostream>

#include <boost/proto/proto.hpp>
namespace proto = boost::proto;

#include <boost/mpl/plus.hpp>
#include <boost/mpl/prior.hpp>
#include <boost/mpl/sizeof.hpp>
namespace mpl = boost::mpl;

struct StringLength
    : proto::or_<
    proto::when<
        proto::terminal<char[proto::N]>
        // 静态计算字符串常量的长度：sizeof("string") - 1
        , mpl::prior<mpl::sizeof_<proto::_value> >()
    >
    , proto::when<
        proto::plus<StringLength, StringLength>
        , proto::fold<
            proto::_                // 子表达式的序列，基元转换
            , mpl::size_t<0>()  // fold的初始状态，对象转换
            // fold的二元操作函数：对象转换，接受当前表达式和fold积累的状态
            , mpl::plus<StringLength, proto::_state>() 
            >
        >
    >
{};

// 可调用的转换，接受expr, state, data
struct TransformCopy 
    : proto::callable
{
    typedef char *result_type;

    template<typename FunType>
    char * operator()(char const *str, char *buf, FunType const& fun) const
    {
        for(; *str; ++str, ++buf)
            *buf = fun(*str); // 可配置的fun由外部作为data传递进来
        
        // 作为新的state传递出去
        return buf;
    }
};

struct StringCopy
    : proto::or_<
    proto::when<
        proto::terminal<char[proto::N]>
        // 遇到终结符则调用拷贝，并返回新的状态
        , TransformCopy(proto::_value, proto::_state, proto::_data)
    >
    , proto::when<
        proto::plus<StringCopy, StringCopy>
        // 遇到加号：先左侧执行StringCopy，结果作为对右侧计算的状态
        , StringCopy(
            proto::_right
            , proto::call< StringCopy(proto::_left/*, proto::_state, proto::_data*/) >
            /*, proto::_data*/
            )
        >
    >
{};

struct ToUpper 
{
    char operator() ( char ch ) const
    {
        if ( ch >= 'a' && ch <= 'z' )
        {
            return 'A' + (ch - 'a');
        }
        return ch;
    }
};

template<typename Expr>
void concatenate( Expr const& expr )
{
    BOOST_MPL_ASSERT(( proto::matches<Expr, StringLength> ));

    static size_t const length =
        boost::result_of<StringLength(Expr)>::type::value;
    
    char buffer[ length + 1 ] = {0};

    // 调用，参数：表达式、状态(目标buf的初始地址)、data
    StringCopy()(expr, &buffer[0], ToUpper());
    std::cout << buffer << std::endl;
}

int main()
{
    concatenate( proto::lit("hello ") + "world" );

    return 0;
}
{% endhighlight %}

输出：  
HELLO WORLD

注意：

1）、`proto::fold<>`是一个基元转换（不需要写成对象转换的语法`proto::fold<>()`），接受一个表达式，状态和二元操作函数，3个模板参数都是转换。其中proto::_是基元转换，对于非终结符，返回子表达式的序列。

`mpl::plus<StringLength, proto::_state>()`中的proto::_state仅表示`proto::fold<>`的二元函数的状态占位。

对于语法StringLength转换本身没有使用状态参数state来执行计算长度。

`proto::fold<>`表达式按语义展开（状态累加）：  
`mpl::plus< StringLength(proto::_right), mpl::plus< StringLength(proto::_left), mpl::size_t<0> > >()`

可以简单的替换为对象转换( 左右子树分别计算再求和 )：  
`mpl::plus< StringLength(proto::_left), StringLength(proto::_right) >()`

2）、注意跟踪状态和数据参数：使用了`wchar_t*`作为更新的状态，每次遇到字符串终结符，都会调用TransformCopy，并且更新对应的状态（buf元素值和状态buf指针），数据参数ToUpper()一直作为proto::_data传递，最后进入TransformCopy执行计算。

3）、注意针对加法的语法：

~~~~
proto::when<
    proto::plus<StringCopy, StringCopy>
    , StringCopy(
         proto::_right
         , proto::call< StringCopy(proto::_left, proto::_state, proto::_data) >
         , proto::_data
    )
>
~~~~

先递归的处理左子树proto::_left，更新buf，并返回新的buf位置作为新状态；
再以新状态作为递归计算右子树的状态。


7、基元转换的隐式参数

proto带转换的语法也是基元转换，可以带1到3个参数。

对于基元转换，没有必要全部给出所有的3个参数，proto会有自动的隐式参数proto::_、proto::_state和proto::_data，从后往前，如果转换的参数恰好是隐式参数，则可以省略。

例如：

~~~~
StringCopy(
   proto::_right
   , proto::call<StringCopy(proto::_left, proto::_state, proto::_data)>
   , proto::_data
   )
~~~~

等价于：

~~~~
StringCopy(
   proto::_right
   , proto::call<StringCopy(proto::_left)>
   )
~~~~

使用`proto::fold<>`基元，可以更加简化( proto::_state恰好是当前状态 )：  
`proto::fold<proto::_, proto::_state, StringCopy>`

注：

1. 尽管`proto::fold<>`的第三个参数需要是二元函数，而StringCopy基元转换接收3个参数，不过如果第三个参数恰好是隐式参数proto::_data，则StringCopy可当成二元函数使用。
2. 初始状态是当前buf位置，是当前表达式的state，即proto::_state

- 关于隐式参数等价的表达式：等价的转换（隐式参数：_、_state、_data）

~~~~
proto::when<_, StringCopy> 
proto::when<_, StringCopy()> 
proto::when<_, StringCopy(_)> 
proto::when<_, StringCopy(_, proto::_state)> 
proto::when<_, StringCopy(_, proto::_state, proto::_data)> 
~~~~

8、proto的内建转换

- 内建基元转换

proto::_value  
: 对于终结符表达式，返回终结符的值。

proto::_child_c<>   
: 对于非终结符，`proto::_child_c<N>`返回N-th子节点

proto::_child   
: 等价于`proto::_child_c<0>`

proto::_left    
: 等价于`proto::_child_c<0>`

proto::_right   
: 等价于`proto::_child_c<1>`

proto::_expr    
: 返回当前表达式

proto::_state   
: 返回当前状态

proto::_data    
: 返回当前数据

`proto::call<>` 
: 对于可调用转换CT，`proto::call<CT>`将可调用转换转为基元转换，有助于区别于对象转换，并兼容某些编译器的问题。

`proto::make<>`   
: 对于对象转换OT，`proto::make<OT>`将对象转换转为基元转换。

`proto::_default<>`   
: 对于语法G，`proto::_default<G>`将使用C++默认的表达式语义来计算，比如对于二元加号节点，两个子节点按照G计算后，结果再相加返回。

`proto::fold<>`   
: 对于三个转换ET, ST和FT，`proto::fold<ET, ST, FT>` 首先计算ET来产生一个fusion序列，计算ST来产生fold的初始状态，然后使用FT针对每个元素和老的状态来产生新的状态。

`proto::reverse_fold<> `  
: `proto::fold<>`的逆序计算

`proto::fold_tree<>`  
: 类似于`proto::fold<ET, ST, FT>`，除了计算ET时平滑（flatten）表达式，这样会使相同tag的父子节点进入同一个序列，例如`a >> b >> c`将平滑成序列`[a b c]`。

`proto::reverse_fold_tree<> ` 
: `proto::fold_tree<>`的逆序

`proto::lazy<>`   
: 结合了`proto::make<>`和`proto::call<>`，`proto::lazy<R(A0,A1...An)>`先计算`proto::make<R()>`来产生一个可调用类型 R2，然后执行计算`proto::call<R2(A0,A1...An)>`。



- 所有语法也是基元转换

`proto::_`    
: 当前表达式

`proto::or_<> `   
: 选择一个匹配的子表达式，并应用对应的转换

`proto::and_<>`   
: 匹配所有的子表达式，并应用它们的转换，且返回最后一个转换的值

`proto::not_<>`   
: 返回当前的表达式（因为能进入，当前表达式肯定满足`proto::not_<>`）

`proto::if_<> `   
: 给定三个转换，先计算第一个转换得到一个编译期常bool型，true则计算第二个转换，否则计算第三个转换。

`proto::switch_<> `   
: 与`proto::or_<>`类型，找到匹配的子语法，并应用对应的转换。

`proto::terminal<>`   
: 返回当前的终结符表达式


- 所有运算符表达式语法也是转换（pass-through 转换）

表达式语法项直接作为基元转化比较特殊，称为pass-through转换：接受某个tag类型，并产生该类型的新的表达式，而每个子表达式是根据pass-through转换的子语法来转换得到。

比如：

`proto::plus<>`   
: 如果proto表达式匹配`proto::plus<G0, G1>`，作为基元转换，将产生一个plus的节点，并且左子树G0转换得到，右子树由G1转换得到。

`proto::nary_expr<>`  
: 也是返回对应的节点类型，并且所有的子树根据匹配的对应转换得到。

`proto::function< X, proto::vararg<Y> >`  
: 匹配函数表达式，并且第一个子树匹配X语法，其余的匹配Y语法；作为基元转换，将产生一个新的函数表达式，并且第一个子树根据X来转换得到，其余根据Y来得到。

Pass-Through Transforms 的表达式语法

~~~~
proto::unary_plus<>     
proto::comma<> 
proto::negate<>     
proto::mem_ptr<> 
proto::dereference<>    
proto::assign<> 
proto::complement<>     
proto::shift_left_assign<> 
proto::address_of<>     
proto::shift_right_assign<> 
proto::logical_not<>    
proto::multiplies_assign<> 
proto::pre_inc<>    
proto::divides_assign<> 
proto::pre_dec<>    
proto::modulus_assign<> 
proto::post_inc<>   
proto::plus_assign<> 
proto::post_dec<>   
proto::minus_assign<> 
proto::shift_left<>     
proto::bitwise_and_assign<> 
proto::shift_right<>    
proto::bitwise_or_assign<> 
proto::multiplies<>     
proto::bitwise_xor_assign<> 
proto::divides<>    
proto::subscript<> 
proto::modulus<>    
proto::if_else_<> 
proto::plus<>   
proto::function<> 
proto::minus<>  
proto::unary_expr<> 
proto::less<>   
proto::binary_expr<> 
proto::greater<>    
proto::nary_expr<> 
proto::less_equal<>     
proto::logical_and<> 
proto::greater_equal<>  
proto::bitwise_and<> 
proto::equal_to<>   
proto::bitwise_or<> 
proto::not_equal_to<>   
proto::bitwise_xor<> 
proto::logical_or<>     
~~~~

9、proto运算符的多重身份表现

- 作为元函数，产生表达式

~~~~
typedef proto::terminal<int>::type int_;
typedef proto::plus<int_, int_>::type plus_;
int_ i = {42}, j = {24};
plus_ p = {i, j};
~~~~

- 作为语法，用于匹配

~~~~
struct Int : proto::terminal<int> {};
struct Plus : proto::plus<Int, Int> {};

BOOST_MPL_ASSERT(( proto::matches< int_, Int > ));
BOOST_MPL_ASSERT(( proto::matches< plus_, Plus > ));
~~~~

- 作为基元转换

{% highlight c++ %}
#include <boost/proto/proto.hpp>
using namespace boost;

#include <iostream>
using namespace std;

// 删除一元加号语法
struct RemoveUnaryPlus
    : proto::or_<
    proto::when<
        proto::unary_plus<RemoveUnaryPlus>
        // 遇到一元加号，直接处理子表达式
        , RemoveUnaryPlus(proto::_child)
    >
    // proto::terminal<>和nary_expr<> 作为语法和基元转换
    , proto::terminal<proto::_> // 终结符不处理
    // 其他的节点类型，处理其各子树
    , proto::nary_expr<proto::_, proto::vararg<RemoveUnaryPlus> >
    >
{};

int main()
{
    proto::literal<int> i(0);
    // i - (i - i)
    proto::display_expr( RemoveUnaryPlus()(+i - +(i - +i)) ); 

    return 0;
}
{% endhighlight %}

9、构建自定义的基元转换

创建基元转换只要实现一个通用的模板：

1. 类型本身继承自`proto::transform<>`。
2. 内嵌一个`impl<>`模板，继承自`proto::transform_impl<>`，并实现内嵌的result_type和operator()定义。
3. 特化is_callable模板。

例如：

{% highlight c++ %}
// 基元转换proto::_child_c<N>的实现
namespace boost { namespace proto
{
    template<int N>
    struct _child_c : transform<_child_c<N> >
    {
        template<typename Expr, typename State, typename Data>
        struct impl : transform_impl<Expr, State, Data>
        {
            typedef
                typename result_of::child_c<Expr, N>::type
                result_type;

            result_type operator ()(
                typename impl::expr_param e
                , typename impl::state_param
                , typename impl::data_param
                ) const
            {
                return proto::child_c<N>(e);
            }
        };
    };

    template<int N>
    struct is_callable<_child_c<N> >
        : mpl::true_
    {};
}// proto
}// boost
{% endhighlight %}

注意：  
1）、基类`transform<>`提供了operator()重载以及内嵌的`result<>`模板，使得创建的类型为标准的函数对象，而对应的真正实现由我们提供的内嵌`impl<>`模板来实现。  
2）、`transform_impl<>`基类提供了一些通用的typedef：


|---
| typedef | 意义
|-|:-|:-:|-: 
| `expr`        | `typename remove_reference<Expr>::type `
| `state`       | `typename remove_reference<State>::type `
| `data`        | `typename remove_reference<Data>::type `
| `expr_param`  | `typename add_reference<typename add_const<Expr>::type>::type `
| `state_param` | `typename add_reference<typename add_const<State>::type>::type `
| `data_param`  | `typename add_reference<typename add_const<Data>::type>::type `


10、关于可调用转换的返回值 — 签名推导法

继承自proto::callable的可调用转换，很多时候需要推导该函数对象的返回值，如果将可调用转换写成模板是十分不利的，会导致使用的语法转换场景中需要推导模板参数，为了避免这个窘境，proto对于自定义的可调用转换，提供了签名推导返回类型的机制。其实是使用了`boost::result_of<>`的签名返回类型机制。如果不存在reslut_type的typedef，需要内嵌一个`result<>`模板，针对operator()不同的签名方式都能分别计算出对应的内嵌type。

例如，终结符是`vector<>`的下标取值操作：

{% highlight c++ %}
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
{% endhighlight %}

11、使得转换可调用

转换的常见形式：`proto::when< Something, R(A0,A1,…) >`，对于R是一个要调用的函数，还是要创建的对象，`proto::when<>`使用`proto::is_callable<>`来判断，尽管proto会猜测，但最好还是显式的标识出来。
对于类型R，`proto::is_callable<R>`检查是否从proto::callable继承，但是，如果R是一个模板特化，proto对认为他不是callable的，不管它是否继承自proto::callable。

比如：

~~~~
template<typename T>
struct times2 : proto::callable
{
    typedef T result_type;

    T operator()(T i) const
    {
        return i * 2;
    }
};
~~~~

~~~~
// 错误方式：
struct IntTimes2
    : proto::when<
        proto::terminal<int>
        , times2<int>(proto::_value)
    >
{};
~~~~

将无法使用：`IntTimes2()( proto::lit(5)，times2<int>没有被识别为callable`

// 正确方式1：

~~~~
struct IntTimes2
    : proto::when<
        proto::terminal<int>
        , proto::call<times2<int>(proto::_value)>
    >
{};
~~~~

使用`proto::call<>`将可调用转换转化为基元转换，以区别于对象转换。


// 正确方式2：

~~~~
namespace boost { namespace proto
{
    template<typename T>
    struct is_callable<times2<T> >
        : mpl::true_
    {};
}}

struct IntTimes2
    : proto::when<
        proto::terminal<int>
        , times2<int>(proto::_value)
    >
{};
~~~~

使用`proto::is_callable<>`来显式的告诉proto可调用。


// 正确方式3：
// 不直接使用模板特化

~~~~
struct times2int : times2<int> {};

struct IntTimes2
    : proto::when<
        proto::terminal<int>
        , times2int(proto::_value)
    >
{};
~~~~

不直接使用模板特化来避免proto对于模板特化语法转换识别的歧义。


// 正确方式4：

~~~~
template<typename T, typename dummy = proto::callable>
struct times2 : proto::callable
{
    typedef T result_type;

    T operator()(T i) const
    {
        return i * 2;
    }
};

struct IntTimes2
    : proto::when<
        proto::terminal<int>
        , times2<int>(proto::_value)
    >
{};
~~~~

使用一个哑元dummy模板参数，默认设为proto::callable，这样proto就能将其识别为可调用转换。

