---
layout: article
title: C++模板 - 编译期的函数式编程
category: c++
description: C++模板在编译期的行为与纯函数式编程有很多相似之处，通过观察函数式编程，并使用C++模板与之类比，来深入分析C++模板作为C++编译期的函数式编程的基础设施，掌握C++模板的本质及其灵活应用。
---
*C++模板在编译期的行为与纯函数式编程有很多相似之处。通过观察函数式编程，并使用C++模板与之类比，来深入分析C++模板作为C++编译期的函数式编程的基础设施，掌握C++模板的本质及其灵活应用。*
 
## 函数式编程的基本特征：
1. 没有变量，函数没有副作用
2. 支持闭包和高阶函数：函数作为第一类对象；高阶函数可以使用其他函数作为输入参数；函数可以返回函数作为输出
3. 递归：使用递归作为控制流程的机制
4. 模式匹配
5. 列表作为基本类型：支持列表模式匹配和列表解析
 
接下来以函数式编程的视角，使用函数式语言Erlang与C++模板的对比来阐述C++模板的函数式编程特质：
 
## 没有变量，函数没有副作用

### Erlang
Erlang是强动态类型的函数式语言，没有变量的概念，或者说只支持一次赋值，以后不能改变。正是因为没有变量，保证了函数不会有副作用，相同的输入必定得到相同的输出。
 
{% highlight erlang %}
%%  Erlang赋值及函数
A = 5.
A = 6.       % error A不能再赋值了
 
Fun = fun(X) -> X*X end.
Fun( A );   % 返回25
{% endhighlight %} 
 
### C++
对于C++，编译期可以使用的称为元数据：包括整型常量（还包括成员指针，枚举）和类型。由于C++函数是运行期的，在编译期不能执行任何效果，因而在编译期可以使用的函数并不是普通函数，而是元函数：带内嵌（typedef）类型type的模板类型。
 
{% highlight c++ %}
// 元函数
template<typename T>
struct AddRef
{
    enum{ value = 5 }; // 枚举也是元数据，可以在编译期使用
    typedef T& type;
};
 
// 注：C++运行期函数 VS. C++编译期元函数
// 运行期函数
int add(int a,int b)
{
    return a + b;
}
add( 3,5 ); // 8
 
// 编译期元函数
template<typename a, typename b>
struct add
{
    typedef mpl::int_< a::value, b::value > type;
};
add< mpl::int_<3>, mpl::int_<5> >::type; // mpl::int_<8>
{% endhighlight %} 
 
* 运行期函数：接受参数变量，并可以返回值，通过调用执行计算。
* 编译期元函数：接受参数类型，并可以返回类型，通过访问内嵌的类型add<>::type执行编译期计算。
 
 
## 支持闭包和高阶函数

### Erlang
Erlang直接支持lambda表达式，返回函数；并且支持高阶函数，可以接受函数或返回函数。

{% highlight erlang %}
%% lambda
Add = fun(A, B) -> A + B end.
Add(1,2).           % 3
 
%% pr_func接受两个谓词函数，并返回可以接受单参数的谓词（对两个谓词取or）
or_func( P1, P2 ) ->
         fun(X) -> P1(X) or P2(X) end.
{% endhighlight %}  
 
### C++
编译期C++不直接支持lambda，只能通过定义类模板来定义元函数；然而元函数直接支持高阶函数，即：元函数可以接受其他元函数数作为参数，并且可以返回元函数。
 
{% highlight c++ %}
// or_func接受两个谓词元函数，返回元函数lambda，可接受单个参数
template
< 
    template<typename> class P1,
    template<typename> class P2
> 
struct or_func
{
    template<typename T>
    struct lambda
    {
       static const bool value = P1<T>::value || P2<T>::value;
    };
};
 
or_func
< 
    boost::is_pointer, 
    boost::is_class 
>::template lambda< string >::value; // true
{% endhighlight %}
 

## 递归作为流程控制

### Erlang
Elang函数定义，一般使用递归调用来控制流程，而递归调用的选择又充斥了参数模式匹配的思想。
 
{% highlight erlang %}
%% 阶乘：定义中递归调用，模式匹配决定调用终止
fact(0) -> 1;
fact(N) -> N * fact(N-1).
{% endhighlight %}   
 
### C++
C++的编译期元函数也支持递归调用，元函数的调用又伴随着模板的实例化，因此递归的调用元函数是递归实例化的过程；另一方面，元函数的递归调用依赖于模板的（偏）特化等，而模板特化的优先选择的规则与函数式编程的模式匹配是一致的思想。
 
{% highlight c++ %}
// 阶乘：定义中递归调用元函数，特化来决定调用终止
template<int N>
struct fact
{
    enum { value = N * fact<N-1>::value };
};
 
// 特化
template<>
struct fact<0>
{
    enum{ value = 1 };
};
{% endhighlight %}   
 

## 模式匹配

### Erlang
模式匹配是Erlang中最重要的机制，任何类型的赋值，函数参数的匹配，流程结构等都包含了模式匹配的思想。而C++的编译期最重要的元素是元函数，因此以Erlang函数的模式匹配为例来比较。
 
{% highlight erlang %}
%% erlang
is_zero(0) -> true;
is_zero(X) -> false.            % X匹配除0以外的情况
{% endhighlight %} 
 
### C++
C++模板使用偏特化和全特化来支持模式匹配。
 
{% highlight c++ %}
// 一般情况
template<typename T>
struct is_ptr
{
    static const bool value = false;
};
 
// 针对指针的偏特化
template<typename T>
struct is_ptr<T*>
{
    static const bool value = true;
};
{% endhighlight %} 
 

## 列表模式匹配 和 列表解析

### Erlang
列表是Erlang中最基本的一种对象，可以存储一列不同类型的对象。列表支持[ head | tail ]方式的模式匹配，并且还支持表达能力很强的列表解析。
 
{% highlight erlang %}
%% 排列
perm( [] ) -> [[]];
perm( L ) -> [ [H | T] || H <- L, T <- perm( L--[H] ) ].
 
> perm([1,2,3]).
[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
 
%% 组合
combination( L ) -> combination_helper(L) -- [[]].
 
combination_helper( [] ) -> [ [] ];
combination_helper( [H | T] ) ->
         [ [H | Tail] || Tail <- combination_helper(T) ] ++ combination_helper(T).
 
> maths:combination( [1,2,3] ).
[[1,2,3],[1,2],[1,3],[1],[2,3],[2],[3]]
{% endhighlight %} 
 
### C++
编译期C++，在C++11之前没有列表的概念，如果有也是通过定义多参数的模板来实现的，比如`mpl::vector< … >`，这种类型列表也很有用，通过精心构造也可以实现很多算法和操作函数，这就是boost的MPL库在做的事情。
然而C++语法的限制，使得实现和操作这种类型列表很麻烦，也不直接，这都归结于C++对于编译期类型列表不支持，即列表表达能力的欠缺。
 
这种形势在根本上将得到缓和，即C++11支持变长模板参数（Variadic Templates）后，对列表模式匹配有了直接的支持，尽管对列表解析没有能直接支持，不过可以构造一个变长类型列表typelist来间接实现。
 
 
例1：  

比较列表模式匹配，都实现一个函数all，接受一个谓词Pred和一个列表，表示是否列表元素都满足谓词。
 
{% highlight erlang %}
% Erlang
all(_Pred, []) -> true;
all( Pred, [Head | Tail] ) ->
         Pred(Head) and all(Pred, Tail).
 
> all( fun(X)-> X rem 2 == 0 end, [2,4,6,8] ).     % true
{% endhighlight %}  
 
{% highlight c++ %}
// C++
#include <iostream>
#include <boost/type_traits.hpp>
using namespace std;
 
template
< 
    template<typename> class Pred,
    typename... List
> 
struct all;   // 前置声明
 
template
< 
    template<typename> class Pred
> 
struct all<Pred>  // 针对列表为空时的特殊处理
{
    static const bool value = true;
};
 
template
< 
    template<typename> class Pred,
    typename Head,
    typename... Tail
> 
struct all< Pred, Head, Tail... >  // 使用[ Head | Tail ]来匹配列表
{
    static const bool value = 
        Pred<Head>::value && all<Pred, Tail...>::value;
};
 
int main()
{
    static_assert( all< boost::is_pointer, int*, double* >::value, 
        "all pointer" );
    return 0;
}
{% endhighlight %} 
 
 
例2：  

比较列表模式匹配，实现一个折叠函数fold。
 
{% highlight erlang %}
% Erlang
fold( F, Init, [] ) -> Init;
fold( F, Init, [Head | Tail] ) ->
    fold( F, F(Init, Head), Tail ).
 
> fold( fun(X,Y)->X+Y end, 0, [1,2,3,4] ).            % 10
{% endhighlight %} 
 
 
{% highlight c++ %}
// C++
#include <iostream>
#include <boost/mpl/int.hpp>
using namespace std;
 
template
< 
    template<typename, int> class F,
    int Init,
    typename... List
> 
struct fold;
 
template
< 
    template<typename, int> class F,
    int Init
> 
struct fold<F, Init>
{
    static const int value = Init;
};
 
template
< 
    template<typename, int> class F,
    int Init,
    typename Head,
    typename... Tail
> 
struct fold< F, Init, Head, Tail... >
{
    static const int value = 
        fold< F, F<Head, Init>::value, Tail... >::value;
};
 
using boost::mpl::int_;
 
template<typename Int, int N>
struct Func
{
    static const int value = N + Int::value;
};
 
 
int main()
{
    // 10
    cout << 
        fold< Func, 0, int_<1>, int_<2>, int_<3>, int_<4> >::value 
        << endl;
 
    return 0;
}
{% endhighlight %}  
 
 
例3：  
C++如何实现列表解析。
 
{% highlight erlang %}
% Erlang：实现列表的平方和
square_sum( L ) -> sum( [ X*X || X <- L ] ).
 
sum( [] ) -> 0;
sum( [Head | Tail] ) -> Head + sum(Tail).
 
> square_sum( [1,2,3,4] ).   % 30
{% endhighlight %}  
 
注：
列表解析最关键的部分是：`[ X*X || X <- L ]` 能直接返回一个列表对象，Erlang对列表解析直接支持，可以用一个或多个列表快速的变换出一个新的列表（上面的排列和组合的例子中，也使用了列表解析）。列表解析是表达能力非常强的一种方式。
 

{% highlight c++ %}
// C++
#include <iostream>
using namespace std;
 
#include <boost/mpl/int.hpp>
using boost::mpl::int_;
 
// sum
template<typename... list>
struct sum;
 
template<>
struct sum<>
{
    enum { value = 0 };
};
 
template<typename Head, typename... Tail>
struct sum<Head, Tail...>
{
    enum { value = Head::value + sum<Tail...>::value };
};
 
// suqare
template<typename N>
struct square
{
    typedef int_<N::value * N::value> type;
};
 
// square_sum
template< typename... list >
struct square_sum
{
    enum{ value = sum< typename square<list>::type... >::value };
};
 
 
int main()
{
    // 30
    cout << 
        square_sum< int_<1>, int_<2>, int_<3>, int_<4> >::value 
        << endl;
    return 0;
}
{% endhighlight %}  
 
注：

* 最关键的是：`typename square<list>::type...` 对应列表解析模式 `[ X*X || X <- L ]`，但是两者有本质的区别，前者是C++编译期的语法，编译时被扩展，是一列参数的别名，不是一个类型；
* 而列表解析得到的结果是实实在在的数据列表。所以支持列表解析的问题才刚刚开始。
 
比如：
{% highlight erlang %}
% 实现映射：列表L的每个元素，得到新的列表[ F(x)… ]
map(F, L) -> [ F(X) || X <- L ].
 
> map( fun(X)->X*X end, [1,2,3,4] ).       % 输出 [1,4,9,16]
{% endhighlight %}   
 
分析下要直接支持列表解析，C++还缺少的因素。对于C++来说，需要一个类型列表来存储列表解析的结果，然而，由于C++11语法规定，变长模板参数的参数包不是一个列表类型，只是编译期展开，因此类型列表需要另谋他路；另一方面，语法规定，参数包模式只能用于其他可以接受变长模板的地方，因此如果要支持变长列表类型，定义接受变长模板参数的类型列表typelist势在必行。
 
{% highlight c++ %}
#include <iostream>
#include <typeinfo>
using namespace std;
 
#include <boost/mpl/int.hpp>
using boost::mpl::int_;
 
// typelist：实现一个功能简单的接受变长模板参数的类型列表
template<typename... list>
struct typelist;
 
template<typename Head, typename... Tail>
struct typelist<Head, Tail...>
{
    typedef Head head;
    typedef typelist<Tail...> tail;
};
 
// length<tl>::value：typelist的长度
template<typename tl>
struct length
{
    enum{ value = 1 + length< typename tl::tail >::value };
};
 
template<>
struct length<typelist<>>
{
    enum{ value = 0 };
};
 
// at<N, tl>::type：typelist的序号N的类型
template<int N, typename tl>
struct at;
 
template<typename tl>
struct at<0, tl>
{
    static_assert( 0 < length<tl>::value, "N is invalid" );
 
    typedef typename tl::head type;
};
 
template<int N, typename tl>
struct at
{
    static_assert( N >= 0 && N < length<tl>::value, "N is invalid" );
 
    typedef typename at<N-1, typename tl::tail>::type type;
};
 
// map：我们需要的映射元函数
template
< 
    template<typename> class F,
    typename... list
> 
struct map
{
    typedef typelist< typename F<list>::type... > type;
};
 
// square：操作函数
template<typename N>
struct square
{
    typedef int_<N::value * N::value> type;
};
 
// print：辅助打印类型列表
template<typename tl, int idx = length<tl>::value - 1 >
struct print
{
    void operator() () const
    {
        print<tl, idx-1>()();
 
        typedef typename at<idx,tl>::type int_type;
        cout << int_type::value << endl;
    }
};
 
template<typename tl >
struct print<tl, -1>
{
    void operator() () const {}
};
 
int main()
{
    typedef typename map< square, int_<1>, int_<2>, int_<3>, int_<4> >::type list;
   
    print<list>()();
 
    return 0;
}
 
// 输出：
1
4
9
16
{% endhighlight %}   
 
 

