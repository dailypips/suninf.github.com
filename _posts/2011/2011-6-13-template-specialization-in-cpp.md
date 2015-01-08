---
layout: article
title: C++模板特化分析
category: c++
---

C++模板扮演着重要的角色，所有的STL容器，算法，迭代器，适配器，所有的高级boost库都是用模板实现的。

C++模板用于两个不同的方面：`类模板`和`函数模板`（包括类的成员函数模板）。比如：

- 类模板：容器，迭代器，容器/迭代器的适配器，boost的shared_ptr, bind, function等
- 函数模板：所有的STL算法，函数(对象)适配器（其实也需要类模板协助），功能函数swap等
 
虽然基本理念都是为了泛型，同一份代码（函数，容器等）支持多种类型，但它们在特性上有着本质的区别：

## 模板参数的使用差异

模板类的使用时，必须加上模板参数来实例化得到真正的类，不存在推断；**而函数模板具有推断的特性**，只需要提供无法推断出的类型来指明（当然无法推断的模板参数应该写在模板参数列表的前面），一般情况是，函数模板使用不需要提供模板参数，因为大部分情况，所有参数是可以推断出来的。

比如：

- `vector<int>` 是一个真正的类，编译器看到int，才会去生成vector<int>类的代码。
- `find( first, last, val )` 算法find的三个参数其实都是模板参数声明的，借助于编译器的型别推断，无需指定模板参数。

需要指定函数模板参数的例子：

{% highlight c++ %}
template< typename ReturnType, typename >
ReturnType fun( const T& );
{% endhighlight %}

显然，我们对于ReturnType是无法推断的，使用fun这个函数就需要显式指定，另外注意一点，无法推断的模板参数需要写在前面，因为使用时指定的模板参数顺序与模板参数声明时的顺序一致。

比如：

{% highlight c++ %}
#include <iostream>
#include <string>
using namespace std;
template< typename T, typename U >
U f( const T& t )
{
    cout << t << endl;
    return U();
}

// 无法推断的模板参数应该放在前面，这样方便指定
template< typename R, typename T >
R g( const T& t )
{
    cout << t << endl;
    return R();
}
int main()
{
    // 对于f为了指定返回U类型为int，必须提供整个模板参数
    f<string,int>( string("zhenshan") );
    
    // 指定U为int，而T自定推导为string
    g<int>( string("zhenshan") );
    return 0;
}
{% endhighlight %}

## 模板特化的差异

类模板的特化(或称专门化)和函数模板的特化有着本质的不同

### 类特化

类特化可以是偏特化，也可以是完全特化，注意，如果对类模板进行特化，整个类的内容需要重新书写。

举个例子：

{% highlight c++ %}
#include <iostream>
#include <vector>
#include <list>
#include <string>
#include <algorithm>
#include <assert.h>
#include <iterator>
using namespace std;

//原始模板定义，类带有两个模板参数
template< int N, typename Seq >
class Prop
{
public:
    Prop( const Seq& s ) :seq_(s) { init(); }
    typedef typename Seq::value_type value_type;
    value_type value;
private:
    const Seq& seq_;
    void init()
    {
        assert( seq_.size() > N );
        typename Seq::const_iterator cit = seq_.begin();
        advance( cit, N );
        value = *cit;
    }
};
 
// 偏特化，第二个模板参数用vector<bool>特化
template< int N >
class Prop<N, vector<bool> >
{
public:
    Prop( const vector<bool>& s ) :seq_(s) 
    {
        assert( seq_.size() > N ); 
        value = seq_[N]; 
    }
    
    typedef bool value_type;
    value_type value;
private:
    const vector<bool>& seq_;
};
int main()
{
    list<int> vect;
    for ( int i=0; i<10; ++i )
    {
        vect.push_back(i);
    }
    
    cout << Prop<3,list<int> >(vect).value << endl; //3
    vector<bool> bVect;
    bVect.push_back( true );
    bVect.push_back( false );
    bVect.push_back( true );
    cout << Prop<1, vector<bool> >(bVect).value << endl;// 0
    cout << Prop<2, vector<bool> >(bVect).value << endl;// 1
    return 0;
}
{% endhighlight %}


### 模板类的成员函数**实例化惰性**

没有使用的成员函数不会被实例化，这样有时候实现通用的包装非常方便

{% highlight c++ %}
// 实现包装一个lambda函数的通用函数
#include <iostream>

template<typename F>
struct LambdaWrapper 
{
    LambdaWrapper(F const& f) : func_(f) {}
    void ReadCallback(int status, std::string data) { func_(status, data); }
    void WriteCallback(int status) { func_(status); }
    F func_;
};

template<typename F>
LambdaWrapper<F> Lambda( F const& f )
{
    return LambdaWrapper<F>(f);
}

int main()
{   
    auto f1 = Lambda( [](int n, std::string data)
    { 
        std::cout << "f1 status: " << n << 
            "; data: " << data << std::endl; 
    } );

    f1.ReadCallback(0, "hemmo world");

    auto f2 = Lambda( [](int n)
    { 
        std::cout << "f2 status: " << n << std::endl; 
    } );
    f2.WriteCallback(1);

    return 0;
}
{% endhighlight %}

输出：  
f1 status: 0; data: hemmo world  
f2 status: 1  


### 关于函数模板的重载和全特化

一、函数模板的全特化，与类模板的全特化基本一致，不过，类模板的全特化，必须照样提供模板参数，比如，前面的代码，继续特化：

{% highlight c++ %}
template<>
class Prop<0,string> // 需要显式提供模板参数
{// ...
};
{% endhighlight %}

而函数模板的全特化时，模板参数可加可不加。例如：

{% highlight c++ %}
template< typename T, typename U >
T fun( const U& );

// 全特化：
template<>
void fun<void,string>( const string& ); //<void,string>可以省略
{% endhighlight %}


二、没有偏特化，只有重载，根本原因是编译器不允许函数模板定义时，部分指定模板参数。

{% highlight c++ %}
// 例如，下面的函数模板定义是错的：
template< typename U >
int fun<int,U>( const U& ); // 出错，不允许出现<int,U>这样的函数模板参数

//应该直接：
template<typename U >
int fun( const U& ); // 在意思上，貌似是将T特化为int，但它不是上述函数模板的偏特化，而是重载。
{% endhighlight %}

三、存在函数模板重载时，进行全特化不能省略模板参数，否则到底是对哪个函数模板全特化，不确定，编译不能通过。调用时能自动选择最合适的函数。
 
四、**主函数模板加入重载决议**
: 主函数模板与普通函数一起加入重载决议，而模板函数的全特化不加入重载决议，并且：普通函数是一等公民，优先被选择；否则，寻找主函数模板中最佳的匹配，在选择了某个主函数模板的前提下，其特化版本才可能被选择。

例如：

{% highlight c++ %}
// (1)
template<typename T>
void f(T);               // a
 
template<>
void f<int*>( int* );    // b
 
template<typename T>
void f(T*);              // c
 
int n=0;
f(&n);  // 调用C：因为根据重载决议，指针将最佳匹配主函数模板C

// (2)
template<typename T>
void f(T);               // a
 
template<typename T>
void f(T*);              // b
 
template<>
void f<int>( int* );     // c
 
int n=0;
f(&n);  // 调用C：因为根据重载决议优先匹配主函数模板b，然后恰好存在实参int*的特化，所以选择C
{% endhighlight %}

原则：

1. 不要使用函数模板特化，因为晦涩的规则将降低代码的可读性。如果想针对实参特殊处理，直接使用普通函数。
2. 如果确实想达到“偏特化”的效果，针对不同类型得到不同的实现，可以使用间接层包装：

{% highlight c++ %}
template<typename T>
void f()
{
    f_impl<T>::f();
}
 
template<typename T>
struct f_impl
{
    static void f()
    {
       // ...
    }
};
{% endhighlight %}
