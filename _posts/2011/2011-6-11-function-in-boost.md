---
layout: article
title: function in boost
category: boost
---

function库突出的能力是存储函数指针或者函数对象，并且自身成为函数对象，且能访问对应的函数（对象）接口。

传统的函数存储是通过函数指针（数组）来实现的，从而实现回调，function库是标准库的一个重要的扩展，为函数对象和函数指针提供了一样的接口来存储，优雅的实现回调，特别是带状态的函数对象以及用bind产生的临时函数对象。
 
## function类的成员函数详解

### function类的对象是函数对象

基本语法：定义function对象`function<result_type(argu1, argu2, ...)>  f`
 
1、构造函数

~~~~
// 从函数指针或者函数对象构造function类的对象
template<typename F> function( F g )


// 用具有引用属性的函数对象来初始化（普通函数函数没有必要）
template<typename F> function( reference_wrapper<F> g )
~~~~

- **一般函数（包括类静态成员函数**

例子：

{% highlight c++ %}
void fun(int a, int b) { cout << a+b << endl; }

function< void (int, int) > f( &fun );
f( 1, 2 ); // 输出3 相当于fun(1,2)
{% endhighlight %}

- **成员函数**

成员函数需要绑定到实际对象才有意义，有三种语义：值语义、引用和指针。语法上需要增加一个对象对应的参数。

例子：

{% highlight c++ %}
#include <iostream>
using namespace std;
 
#include <boost\function.hpp>
using namespace boost;
 
struct Test
{
    int n_;
    Test(int n=0) : n_(n) { }
    void fun(int a, int b) { cout << n_+a+b << endl; n_++; }
};

int main()
{
    Test t(2);
    function< void (Test, int, int) > f( &Test::fun );
    f( t, 1, 2 );
    f( t, 1, 2 );
    cout << "n = " << t.n_ << endl;
    
    function< void ( Test&, int, int ) > g( &Test::fun );
    g( t, 1, 2 );
    g( t, 1, 2 );
    cout << "n = " << t.n_ << endl;
    
    function< void ( Test*, int, int ) > h( &Test::fun );
    h( &t, 1, 2 );
    h( &t, 1, 2 );
    cout << "n = " << t.n_ << endl;
    
    return 0;
}
{% endhighlight %}

输出结果：  
5  
5  
n = 2  
5  
6  
n = 4  
7  
8  
n = 6

1. 这里可以看出，成员函数引用或指针语义可以改变类对象的状态。
2. 也说明成员函数的回调也可以优雅的实现。
 
 
- **函数对象**

function 对象拷贝了函数对象的一个副本，也就是说，不会改变原函数对象的状态。

例子：

{% highlight c++ %}
struct Test
{
    int n_;
    Test(int n=0) : n_(n) { }
    void operator() (int a, int b) { cout << n_+a+b << endl; n_++; }
};

Test t(2);
function< void (int, int) > f( t );
f(1, 2); // 输出5
f(1, 2); // 输出6，改变的只是function对象f自己的状态
cout << "n = " << t.n_ << endl; // 输出2，说明函数对象t的状态没变。
{% endhighlight %}
 
 

- **函数对象的引用来构造**

例子：

{% highlight c++ %}
struct Test
{
    int n_;
    Test(int n=0) : n_(n) { }
    void operator () (int a, int b) { cout << n_+a+b << endl; n_++; }
};

Test t(2);
function< void (int, int) > f( ref( t ) );
f( 1, 2 ); // 输出5
f( 1, 2 ); // 输出6
cout << "n = " << t.n_ << endl;// 输出4，f与t的状态同步改变
{% endhighlight %}
 
### 其他成员函数

- **赋值运算**

~~~~
// 只要function模板参数一致，这样得到的func与g具有完全一致的属性（包括是否是引用）
function& operator = ( const function& g )
 
// 函数指针或者函数对象，还可以具有引用属性来赋值
template<typename F> function& operator = ( F g )
~~~~

给上述的两个构造函数，对应的赋值语义，可以是普通函数，成员函数，函数对象（的引用）等等。

例子：

{% highlight c++ %}
#include <string>
#include <map>
#include <vector>
#include <iostream>
#include <algorithm>
#include <functional>
using namespace std;
 
#include <boost\function.hpp>
using namespace boost;

struct Test
{
    int n_;
    Test(int n=0) : n_(n) { }
    void func(int a, int b) { cout << n_+a+b << endl; n_++; }
    void operator()() { cout << "n = " << n_ << endl; }
};
 
int main()
{
    Test t(2);
    function< void (Test&, int, int) > f;
    function< void (Test, int, int) > k;
    function< void () > g, h;
    
    h = t;
    g = ref(t);
    f = &Test::func;
    k = &Test::func;
    
    k( t, 1, 2 );
    g();
    k( t, 1, 2 );
    g();
    
    f( t, 1, 2 );
    g();
    f( t, 1, 2 );
    g();
    
    h();
    
    return 0;
}
{% endhighlight %}
 
输出：  
5  
n = 2  
5  
n = 2            // k非引用成员函数，t状态不变  
5  
n = 3  
6  
n = 4                      // f引用成员函数，t状态改变  
n = 2                      // 只是t的副本，不会反映给t  
 

- `bool empty()` 

是否是有效的函数对象(function含有函数或函数对象)
 
- `void clear()` 

清除，使不再关联函数对象或者函数
 
- `operator safe_bool() const`

bool上下文中使用，也是用代理类实现，`if( f ) 等价于if( ! f.empty() )`
 
 
## 注意点

### 关于引用传递函数对象

使用引用的两个主要理由：一是对象很大，不想浪费重新分配的时间和空间；二是需要改变状态。一般来说，这两点都与普通函数指针无关，所以function引用的使用主要针对函数对象（或者是类成员函数，因为对应的类对象有状态）。

比如上个例子中的赋值引用的语句：

~~~~
g = ref(t);
function< void (Test&, int, int) > f;
f = &Test::func;
f( t, 1, 2 );
~~~~
 
### 与bind库合作

- Bind是灵活的函数对象生成器。
- Function是灵活的函数对象存储器。

例子：

{% highlight c++ %}
#include <string>
#include <map>
#include <vector>
#include <iostream>
#include <algorithm>
#include <functional>
using namespace std;
 
#include <boost\function.hpp>
#include <boost\bind.hpp>
using namespace boost;
 
int f( int x, int y ) { return 2*x*y; }

struct g
{
    typedef int result_type;
    int operator()( int x, int y )
    {
        return x*( x + y );
    }
};
 
int main()
{
    // (1) g( x+y, f(x, y) ) = (x+y)*(x+y+2xy)
    function< int (int, int) > res = // bind产生的对象
           bind( g(), bind(plus<int>(), _1, _2), bind(&f, _1, _2) );
    cout << res( 1,2 ) << endl;
 
    // (2) 给传入的字符串增加后缀
    function< string (string) > AddString = // 增加后缀
        bind(plus<string>(), _1, string(" [zhenshan]"));
    cout << AddString( "yeah" ) << endl;
 
    return 0;
}
{% endhighlight %}