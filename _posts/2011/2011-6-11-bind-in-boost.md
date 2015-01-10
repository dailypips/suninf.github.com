---
layout: article
title: bind in boost
category: boost
---

bind在表达能力上可以取代所有的标准库配接器，如bind1st, bind2nd, not1, not2, mem_fun_ref, mem_fun, ptr_fun等，而且表达更统一，更清晰。

基本的语法
: `bind( func, argu_or_placeholder1, argu_or_placeholder2, ... )`

其中：  
Func：可以是函数指针、类成员地址、函数对象  
argu_or_placeholdern：参数或者占位符（`_n`）  

返回类型：函数对象，使用的参数由bind使用的所有参数共同指定。参数数目为占位符的数目。


## 常用的几种情况和使用方法

### 和普通函数指针（还有类的静态public成员）一起使用

- **普通函数**

例子：

{% highlight c++ %}
int f( int a, int b, int c ) { return a+b-c; }
bind( &f, _1, 2, _2 ) ( 1,3 )  // 0
 
// 绑定b为2，bind返回的函数对象需要两个参数，
// 参数1对应于f的a，参数2对应f的c
// 所以运算是：1+2-3
{% endhighlight %}
 
- **类静态函数**

类静态函数可以直接取对应地址，不需要对象，类名称只是标明名字作用域（静态数据不能绑定，因为如果要用就像是普通变量一样可以取用）。

例子：

{% highlight c++ %}
class Test
{
public:
   static int f( int a, int b, int c ) { return a+b-c; }
};

bind( &Test::f, _1, _2, _3 ) ( 2,3,1 )  // 2+3-1 = 4
// 和普通函数一样使用，只是多了一层作用域
{% endhighlight %}

 
### 和类的public成员一起使用

特点：
: 第一个参数是要绑定真实的对象(可以是指针，智能指针或对象的引用)，成员函数和成员数据都可以绑定

- **成员函数**

例子：

{% highlight c++ %}
class Test
{
   int n;
public:
   Test(int nn = 0) : n(nn) { }
   int f( int a, int b, int c ) { return n + a+b-c; }
};
 
// 以下三个等价
bind( &Test::f, _1, _2, _3, _2 ) ( shared_ptr< Test >(new Test(5)), 2,3 )
bind( &Test::f, _1, _2, _3, _2 ) ( ref(Test(5)), 2,3 )
bind( &Test::f, _1, _2, _3, _2 ) ( &Test(5), 2,3 )  // n + a+b-c = 5+2+3- 2 = 8
// 占位符_1对应于真实的对象的地址
// 注意这里的两个_2，表现了用占位符占领参数位的灵活性
// 现在第一个_2对应a，第二个_2对应c，_3对应b
{% endhighlight %}
 
- **成员数据**

例子1：

{% highlight c++ %}
class Test
{
public:
   int n;
   Test(int nn = 0) : n(nn) { }
};
 
bind( &Test::n, _1 ) ( &Test(5) )  // 绑定临时对象Test(5)的成员n，
// 等价于Test(5).n
{% endhighlight %}

例子2：

{% highlight c++ %}
#include <string>
#include <map>
#include <vector>
#include <iostream>
#include <algorithm>
#include <functional>
using namespace std;
 
#include <boost\bind.hpp>
using namespace boost;
 
void Print( const string& s ) { cout << s << endl; }
 
int main()
{
    typedef map<int, string> MapType;
    MapType mItoS;
    typedef MapType::value_type value_type;
    mItoS.insert( value_type(0, "sjw") );
    mItoS.insert( value_type(2, "yy") );
    mItoS.insert( value_type(3, "yeah") );
    mItoS.insert( value_type(4, "pp") );
    
    // 用于标准库算法，打印所有的element_type值
    for_each( mItoS.begin(), mItoS.end(), bind( &Print, bind( &value_type::second, _1 ) ) );
    
    return 0;
}
{% endhighlight %}
 
### 和函数对象一起使用

注意语法：

- 如果有typedef返回类型result_type，则`bind( obj, argu_or_placeholder... )`
- 否则，需要用模板参数指定返回类型：`bind<return_type>( obj, argu_or_placeholder... )`

bind的第一个参数为对象实体（不是对象指针）

例子：

{% highlight c++ %}
class Test
{
public:
    typedef int result_type;
    int operator() ( int a, int b, int c )
    {
        return a+b-c;
    }
};

// 有result_type，int可以不指定
bind<int>( Test(), _1, _2, _3 ) ( 1, 2, 3 ) // 1+2-3 = 0，Test()临时对象

Test t;
bind( t, _1, _2, _2 ) ( 2, 3 )   // 2+3-3 = 2
{% endhighlight %}
 
### 嵌套使用bind

传给 bind 的某些参数可以嵌套 bind 表达式自身：`bind(f, bind(g, _1))(x);`

当函数对象被调用的时候，如果没有指定顺序，内部 bind 表达式先于外部 bind 表达式被求值，在外部 bind 表达式被求值的时候，用内部表达式的求值结果取代它们的占位符的位置。在上面的示例中，当用参数列表 (x) 调用那个函数对象的时候，`bind(g, _1)(x)` 首先被求值，生成 g(x)，然后 `bind(f, g(x))(x)` 被求值，生成最终结果 
`f( g(x) )`。
 
例子：

{% highlight c++ %}
int f(int x) { return 2*x; }
int g(int x) { return x*x; }

// f(x) + g(y) = 2*x + y^2
bind( plus<int>(), bind(&f, _1),  bind(&g, _2) ) ( 2, 3 )  // 2*2 + 3^2 = 13
 
// f(g(x)) = 2 * x^2
bind( &f, bind(&g, _1) )( 5 ) // 2 * 5^2 = 50
{% endhighlight %}
 

### bind 重载了操作符，仍返回函数对象

由 bind 生成的函数对象重载了逻辑非操作符 `!` 和关系操作符 `==, !=, <, <=, >, >=, &&, ||`，并且返回函数对象，注意用小括号括起

例子：

{% highlight c++ %}
// f(a, b, x) = ( a < x <= b )
(bind( less<int>(), _1, _3 ) && bind( less_equal<int>(), _3, _2 )) ( 2, 5, 4 )
// 等价于 2<4 && 4<=5，所以为1
 
( !(bind( less<int>(), _1, _3 ) && bind( less_equal<int>(), _3, _2 )) ) (2, 4, 5)
// 等价于 !(2<5 && 5<=4)，所以也为1
{% endhighlight %}


### 配合标准库算法使用bind

例子：

{% highlight c++ %}
#include <cassert>
#include <vector>
#include <iostream>
#include <algorithm>
#include <functional>
using namespace std;
 
#include <boost\bind.hpp>
#include <boost\shared_ptr.hpp>
using namespace boost;
 
struct Base
{
    virtual void Print() { cout << "Base" << endl; }
};
 
struct Derived : Base
{
    virtual void Print() { cout << "Derived" << endl; }
};
 
int main()
{
    vector< shared_ptr<Base> > vectPBase;
    vectPBase.push_back( shared_ptr<Base>(new Base) );
    vectPBase.push_back( shared_ptr<Base>(new Derived) );
    vectPBase.push_back( shared_ptr<Base>(new Derived) );
    vectPBase.push_back( shared_ptr<Base>(new Base) );
    
    // 对vector中的每个指针调用对应的Print()
    for_each( vectPBase.begin(), vectPBase.end(), bind( &Base::Print, _1 ) );
    
    vector<int> vectInts;
    for ( int i=0; i<10; ++i )
    {
        vectInts.push_back(i);
    }
    
    // 每一项变成两倍
    transform( vectInts.begin(), vectInts.end(), vectInts.begin(),
        bind( plus<int>(), _1, _1 ) );
    for ( int i=0; i<10; ++i )
    {
        cout << vectInts[i] << endl;
    }
    
    return 0;
}
{% endhighlight %}
 
