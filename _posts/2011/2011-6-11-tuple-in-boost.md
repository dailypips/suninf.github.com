---
layout: article
title: tuple in boost
category: boost
---

tuple库的基本想法：
 
1. 把给定数目的不同类型的元素统一管理起来，是标准库中pair管理二元类型的一个延伸。并且提供了很好的、统一的构造、赋值、绑定、读取等接口。附带了一个自然的好处，函数可以返回多个值
2. tuple库的内在实现，使得我们可以写元程序(Metaprogramming)，即：Tuple库除了优美的基本使用外，还有灵活高级特性。
 

## tuple的基本使用方法

包含头文件 `#include <boost\tuple\tuple.hpp>`

tuple, make_tuple, tie, get这些名字在boost名字空间中。
 
### 默认构造函数、（部分）值的构造函数

例子：

~~~~
// a的int，double，string元素对应的默认构造
tuple< int, double, string > a; 
~~~~

只要包含的各个类型都有默认构造函数，tuple就能默认构造。
 
例子：

{% highlight c++ %}
struct Test // Test没有默认构造函数
{
    Test( int ) {}
};
 
tuple< Test, int, double, string > a;     // 出错，Test无法默认构造
tuple< Test, int, double, string > a(1);  // 可以，Test用int型值1构造，其他值默// 认构造
tuple< Test, int, double, string > a(0, 1, 3.14, "zhenshan");  // 可以，全部值构造
{% endhighlight %}

注：

1. tuple构造函数是基于所包含类型的构造函数
2. 通过值构造支持隐式转换，当然这个是很自然的机制，但需要注意

比如：

~~~~
struct Test // Test没有默认构造函数
{
    explicit Test( int ) {} // 限制隐式转换
};
~~~~

这时，部分值构造 `tuple< Test, int, double, string > a(1);` 有问题了，需要用`tuple< Test, int, double, string > a( Test(1) );`才可以
 
### 赋值构造函数和赋值运算符

**1、复制构造**

{% highlight c++ %}
template< class T1, class T2, …, class TN >
class tuple
{
Public:
    template< class U1, class U2, …, class UN >
    tuple( const tuple< U1, U2, …, UN >& )
};
{% endhighlight %}

完成构造的要求：

1. 类型数目相等
2. 可以从对应类型U1, U2…的值能够隐式或者自然的构造`T1, T2,…`的值
 
 
**2、赋值运算（与赋值构造一样的规则）**
 
例子：

{% highlight c++ %}
#include <string>
#include <iostream>
using namespace std;
 
#include <boost\tuple\tuple.hpp>
#include <boost\shared_ptr.hpp>
using namespace boost;
 
struct Base
{
    virtual void pt() { cout << "Base" << endl; }
};

struct Derived : Base
{
    virtual void pt() { cout << "Derived" << endl; }
};
 
int main()
{
    tuple< shared_ptr<Base>, short, string > t1( shared_ptr<Base>(new Derived), 2, "sjw" );
    tuple< shared_ptr<Base>, int, string > t2(t1), t3;// 用t1赋值构造t2
    
    // 临时的tuple给t3赋值
    t3 = tuple< shared_ptr<Base>, short, string >( shared_ptr<Base>(new Base), 15, "suninf" );
    
    get<0>(t2)->pt();
    cout << get<1>(t2) << "  " << get<2>(t2) << endl;
    
    t3.get<0>()->pt();
    cout << t3.get<1>() << "  " << t3.get<2>() << endl;
    
    return 0;
}
{% endhighlight %}

输出：  
Derived  
2  sjw  
Base  
15  suninf  
 
 
### 读取元素函数get ( 成员函数与自由函数都有 )

语法：`tp.get<N>()` 或者 `get<N>( tp )`

读取tuple对象tp的索引为N所对应的值。
 
 
### make_tuple函数直接构造tuple对象返回

类似于pair对应make_pair，很方便的构造tuple对象

如：`tuple< int, string > tp = make_tuple( 2, "sjw" );`
 
 
### tie将元素绑定到一个tuple对象（引用绑定）

对这个tuple对象的操作直接反映到所绑定的元素。

例子：

~~~~
tuple< int, string > tp( 2, "sjw" );
int a;
string b;
tie(a,b) = tp;// a b将被改变
cout << a << "  " << b << endl; // 输出：2  sjw
~~~~

另外，tie还可以使用一个特殊的值来占位，boost::tuples::ignore来忽略对应的元素。

例子：

~~~~
tuple< int, string, double > tp( 2, "sjw", 3.14 );
int a;
tie(a,tuples::ignore, tuples::ignore) = tp;
cout << a << endl;
~~~~
 
 
### tuple的比较操作

包含头文件 `#include <boost\tuple\tuple_comparison.hpp>`

支持`==, !=, <, >, <=, >=`运算符，tuple对象的比较是基于所绑定的对象的比较。
其中，==要求所有元素对都相等，!=取反；其他运算符则按字典序进行比较。所以tuple是可以直接排序的。

例子：

~~~~
tuple< int, string, double > tp1( 2, "sjw", 3.14 );
tuple< int, string, double > tp2( 3, "sjw", 3.14 );
tuple< int, string, double > tp3( 3, "sjf", 3.15 );

则有：
tp1 < tp2
tp2 > tp3
~~~~

使用标准容器时，还可以很容易的基于tuple中的某个元素作为排序依据。

例如：

{% highlight c++ %}
#include <string>
#include <vector>
#include <iostream>
#include <algorithm>
using namespace std;
 
#include <boost\tuple\tuple.hpp>
#include <boost\tuple\tuple_comparison.hpp>
 
using namespace boost;
 
template<int Index>
class Less
{
public:
    template < typename Tuple >
    bool operator () ( const Tuple& lhs, const Tuple& rhs )
    {
        return get<Index>(lhs) < get<Index>(rhs);
    }
};
 
struct Print
{
    template<typename Tuple>
    void operator() ( const Tuple& t )
    {
        cout << t.get<0>() << " " << t.get<1>() << " "
               << t.get<2>() << endl;
    }
};
 
int main()
{
    vector< tuple< int, string, double > > vect;
    vect.push_back( make_tuple(2, "sjw", 3.14) );
    vect.push_back( make_tuple(3, "sjf", 3.15) );
    vect.push_back( make_tuple(7, "sjw", 3.14) );
    vect.push_back( make_tuple(5, "sjf", 3.15) );
    vect.push_back( make_tuple(3, "sjf", 3) );
    vect.push_back( make_tuple(4, "sjw", 3.14) );
    vect.push_back( make_tuple(12, "sjf", 3.15) );
    
    sort( vect.begin(), vect.end(), Less<0>() );// 基于第一个元素排序
    for_each( vect.begin(), vect.end(), Print() );
    
    return 0;
}
{% endhighlight %}

打印结果（已经基于第一个元素排序）：  
2 sjw 3.14  
3 sjf 3.15  
3 sjf 3  
4 sjw 3.14  
5 sjf 3.15  
7 sjw 3.14  
12 sjf 3.15  
 
 
### 函数返回多个值问题

函数返回多个值，传统方法是传入很多引用参数，或者组合成struct，然后函数返回结构。

还有一个显然的先决条件是，我们知道需要返回什么，这样，我们可以把需要返回的元素按照自己喜欢的顺序组成一个tuple。有了tuple，当然也可以传入tuple的引用，但我们大可以不必这么麻烦了。直接返回一个tuple就行了，我们既可以用一个tuple去接受，也可以用tie绑定变量来接受。

例子：

{% highlight c++ %}
#include <iostream>
using namespace std;
#include <boost\tuple\tuple.hpp>
using namespace boost;
int gcd(int a, int b ) // 最大公约数
{
    return b==0 ? a : gcd(b,a%b);
}
int lcm(int a, int b) // 最小公倍数
{
    return a*b / gcd(a,b);
}
 
// 同时得到最大公约数和最小公倍数
tuple<int, int> GetGcdAndLcm( int a, int b )
{
    return make_tuple( gcd(a,b), lcm(a,b) );
}
 
int main()
{
    // 用tie引用接收
    int g, l;
    tie(g, l) = GetGcdAndLcm( 30, 48 );
    cout << g << " " << l << endl;
    
    // 直接用一个tuple接收
    tuple<int, int> t = GetGcdAndLcm( 15,12 );
    cout << t.get<0>() << " " << t.get<1>() << endl;
    return 0;
}
{% endhighlight %}
 
## tuple的高级特性，元编程

### tuple的类型管理方法

比如：`tuple<int, string, double>`的内部类型组织是：  
`TypeList< int, TypeList < string, TypeList< double, tuples::null_type > > >`

大体上来说，是嵌套的类型管理列表，并且最终是以tuples::null_type结束的。所以：tuple是以一个特殊的类型tuples::null_type结束的，这对于元编程很有用。
 
### tuple内置的元函数( tuples::element和tuples::length )

- `element<N, T>::type`

tuple类型T的第N个元素的类型，注意：模板参数必须是整型常量或者类型
 
- `length<T>::length` ：tuple类型T的长度
 
- `get_head` ：获取第一个元素对应的值。
 
- `get_tail` ：返回除了第一个值以外的其他值组成的tuple对象。
 
 
### 元编程说明及示例

注意到，对于tuple对象的元素读取`t.get< N >()`，而这个N是编译期就确定的整型常量，我们知道，我们不可能用像for，while之类的来读取元素。
 
先说明一下模板特化：

函数模板特化：
: 首先注意函数模板没有部分特化，因为函数名后不能跟显式的模板参数（当然满足这个条件的部分特化是可以的），其实都是函数重载，即实例化时产生重载函数，于是，函数调用时的遵循参数选择机制，选择某个重载版本。所以，特殊的情况要做好模板函数的重载函数（详见例2）。

注：函数模板没有部分特化的例子，例如：

{% highlight c++ %}
template<class T, class U>
void Print( T a, U b )
{
    cout << "1" << endl;
}
 
template<class T>
void Print<T, int>(T a, int b ) // 对于函数模板错!
{
    cout << "2" << endl;
}
{% endhighlight %}

类模板特化：
: 也是提供了一种类型选择机制，实例化时产生不同的类，其中完全特化时直接已经产生了类。
 
下面举三个例子，展示一下模板特化的功能以及元编程的方式利用tuple的方法。

**例1、模板特化（递归产生类实例）实现打印tuple的所有元素**

{% highlight c++ %}
#include <iostream>
using namespace std;
 
#include <boost\tuple\tuple.hpp>
using namespace boost;
 
template< int Index >
struct PrintHelper
{
    template< typename Tp >
    void operator()( const Tp& t)
    {
        PrintHelper<Index-1>()(t); // 模板类的递归调用
        cout << t.get<Index>() << endl;
    }
};
template<>
struct PrintHelper<0> // 模板类完全特化
{
    template< typename Tp >
    void operator()( const Tp& t)
    {
        cout << t.get<0>() << endl;
    }
};
 
template< typename Tp >
void Print( const Tp& t ) // 包装PrintHelper实现完全打印
{
    PrintHelper< tuples::length<Tp>::value-1 >() ( t );
}
 
int main()
{
    tuple<string, int, double, string> t( "sjw", 5, 3.14, "sjf" );
    Print(t);
    
    return 0;
}
{% endhighlight %}
 
输出结果：  
sjw  
5  
3.14  
sjf  
 
 
**例2、函数特化（递归加上重载函数）来实现打印tuple的所有元素**

注意到我们不能利用Index的偏特化来实现了（参看函数模板特化）。

{% highlight c++ %}
#include <string>
#include <iostream>
using namespace std;
 
#include <boost\tuple\tuple.hpp>
using namespace boost;
 
template< typename Tp >
void Print( const Tp& t )
{
    cout << t.get_head() << endl;
    Print( t.get_tail() );// 递归
}
 
// 函数重载，递归到最后t.get_tail()为null_type对象时进入
void Print( const tuples::null_type& ) { } //不处理
 
int main()
{
    tuple<string, int, double, string> t( "sjw", 5, 3.14, "sjf" );
    Print( t );
    
    return 0;
}
{% endhighlight %}

输出结果：
sjw
5
3.14
sjf
 
 
**例3、构建一个类似于for_each的算法，for_each_element**

说明：for_each是基于普通的循环，对于tuple，循环是不行的，需要递归的使用模板类或者模板函数，下面以模板函数为例实现for_each_element

{% highlight c++ %}
#include <string>
#include <iostream>
using namespace std;
 
#include <boost\tuple\tuple.hpp>
using namespace boost;
 
template<typename Tp, typename Func>
void for_each_element( const Tp& t, Func func )
{
    func( t.get_head() );
    for_each_element( t.get_tail(), func );
}
 
template< typename Func >
void for_each_element( const tuples::null_type&, Func ) { }
 
struct Print
{
    template< typename T >
    void operator()( const T& n ) { cout << n << endl; }
};
 
template< typename T >
struct PrintSpecialType
{// 注意这里的重载，只允许指定的类型T，屏蔽了其他类型
    void operator() ( const T& n ) { cout << n << endl; }
    
    template< typename U >
    void operator()( const U& ) { }
};
 
int main()
{
    tuple<string, int, double, string> t( "sjw", 5, 3.14, "sjf" );
    for_each_element( t, Print() ); // 打印所有
    
    for_each_element( t, PrintSpecialType<string>() ); // 只打印string
    return 0;
}
{% endhighlight %}
 
- 这里展示了一种在tuple上实现算法的很好的方法。
- 也显示了函数模板和函数重载一起使用的神奇和巧妙之处。