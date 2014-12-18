---
layout: article
title: C++运行时惯用法
category: c++
description: 
---

*本文整理了C++的一些运行时的惯用法。*

## pimpl惯用法

对于一个类型T来说，如果内部使用了其他的类型U：

- 可以将U直接做为数据成员，但是这样T和U是耦合的，因为U的定义对于T必须是可见的；
- 也可以只适用U的指针作为数据成员，这样只要有前置声明，知道U是一个类型即可，U的定义可以在T的实现之前可见即可。
 
特别的，将T需要的所有数据都封装起来，放到U中，而T的数据成员仅包含U*，接口信息定义在T的头文件中，而所有的实现，包括U的实现都放到实现文件中，这就是经典的pimpl惯用法。
 
例子：

{% highlight c++ %}
// 头文件
#pragma once
 
#include <boost/shared_ptr.hpp>
 
class MyClass
{
public:
    MyClass();
    void foo();
 
private:
    class MyClassImpl;       // private下私有的内部类 前置声明
    boost::shared_ptr<MyClassImpl> m_pImpl;   // impl的指针
};
{% endhighlight %}
 
{% highlight c++ %}
// 实现文件
#include "MyClass.h"
 
#include <iostream>
 
// implement of impl
class MyClass::MyClassImpl
{
public:
    // 实现需要的一些函数，最终用于实现MyClass
    void foo()
    {
       std::cout << "impl foo" << std::endl;
    }
};
 
// implement class using impl
MyClass::MyClass() :
    m_pImpl( new MyClassImpl )
{
}
 
void MyClass::foo()
{
    if ( m_pImpl )
    {
       m_pImpl->foo();
    }
}
{% endhighlight %}
 
{% highlight c++ %}
// main函数
#include "MyClass.h"
 
int main()
{
    MyClass cls;
    cls.foo();
 
    return 0;
}
{% endhighlight %}
 
输出：  
impl foo  
 
 
### pimpl惯用法的一些好处：

1. 将实现与接口声明完全分离，不依赖于任何类型（因为只使用了指针），接口非常清晰。
2. 由于impl代理类的定义也是在实现文件中，这样如果要修改实现只要修改该实现文件，并且编译的时候只会编译该实现文件。


## 动态数组

很多C++的程序中存在着大量的由类似 `char * p = new char[Length];` 产生的动态数组。带来的是各种异常返回情况都要显式的去匹配调用`delete []p;` 万一有遗漏，很可能产生内存泄漏，而且不小心容易漏写了[]。
 
另外，如果某函数分配的内存需要被其他函数使用，这样没问题，只要把地址或者智能数组传递出去，但如要用其他函数来释放内存，那就是函数流程设计有问题。
 
总之，为了消除为匹配释放内存块而产生的麻烦，我们尽量不要去显示的使用`new T [] & delete []p`对来管理内存块，而是使用能自动管理内存块生命期的类。
 
### 有两个比较好的选择：

- 使用boost库现成的智能数组类 shared_array & scope_array

scope_array由于是独占的，不能拷贝，非常适合在函数中一次性使用。  
shared_array是以引用计数方式共享管理的，可以传递，使用范围更广。  
 
通过get()函数可以取出其管理的内存起始地址，还可以使用operator[]等，就像数组一样使用。
 
- 使用std::vector

对于非空的vector，可以通过 `&(*v.begin())` 取出其管理的内存起始地址
 
例如：
{% highlight c++ %}
#include <iostream>
#include <vector>
using namespace std;
 
#include <boost/scoped_array.hpp>
#include <boost/shared_array.hpp>
 
void Print( const char* str )
{
    cout << str << endl;
}
 
void SmartArray( int len )
{
    char src[] = "hello world";
 
    // scoped_array
    boost::scoped_array<char> scope_ary( new char[len] );
    memset( scope_ary.get(), 0, len );
 
    // shared_array
    boost::shared_array<char> share_ary( new char[len] );
    memset( share_ary.get(), 0, len );
   
    memcpy( share_ary.get(), src, sizeof(src) );
 
    Print(share_ary.get());
}
 
void VectorArray( int len )
{
    char src[] = "hello world";
 
    vector<char> vect_ary(len, 0);
    if ( !vect_ary.empty() )
    {
       // 对于非空的vector，可以取出其内存块的地址
       char* base = &(*vect_ary.begin());
 
       memcpy( base, src, sizeof(src) );
       Print(base);
    }
}
 
int main()
{
    SmartArray(100);
    VectorArray(200);
 
    return 0;
}
{% endhighlight %}


## 函数执行前后控制

关于间接运算符`operator ->`:

1. 使得对象具有一元后缀间接运算符`->`，用法就像指针一样，但是行为自定义。
2. 由于返回类型是自定义的，可以是任何对象类型，包括指针和重载了间接运算符的类型，奇妙的事情出现了，`operator->` 会沿着对象序列一直调用（一般直到遇到指针结束），只要经过合适的包装，就能构造出控制执行过程的有用的东西。
 
先简单分析下operator->的重载的特点：
{% highlight c++ %}
#include <iostream>
#include <vector>
using namespace std;
 
template<typename T>
struct indirect
{
    T& t_;
    indirect( T& t ) : t_(t) {}
 
    T* operator -> ()
    {
       return &t_;
    }
};
 
int main()
{
    vector<int> v(2, 0);
    indirect< vector<int> > indv(v);
 
    cout << indv->size() << endl;
    cout << (indv.operator->())->size() << endl;
 
    return 0;
}
{% endhighlight %}

输出：  
2  
2  
 
说明：

1. `indv->size()`与`(indv.operator->())->size()`等价，这也是对象`operator->`重载的本质特征。
2. 通过`operator->`运算符，可以将完全没有附属关系的类型和成员函数（对象）关联起来（即：`indirect<T>`类型与size方法），这是C++语法赋予`operator->`独特的能力。
 
 
### 关于`operator->`的能力扩展

1、对函数执行进行 — 分析日志，性能分析等

{% highlight c++ %}
#include <iostream>
#include <string>
using namespace std;
 
template< typename T >
struct indirect
{
    template<typename U>
    struct proxy
    {
       U& u_;
 
       proxy(U& u) : u_(u)
       {
           cout << "prefix" << endl;
       }
 
       ~proxy()
       {
           cout << "suffix" << endl;
       }
 
       U* operator -> ()
       {
           return &u_;
       }
    };
 
    proxy<T> t_;
    indirect( T& t ) : t_(t) {}
 
    proxy<T>& operator -> ()
    {
       return t_;
    }
};
 
struct MyClass
{
    MyClass()
    {
    // 对某个成员函数的调用监控
       indirect<MyClass>(*this) -> init();
    }
 
    void init() { cout << "init" << endl; }
};
 
int main()
{
    string s;
 
    indirect< string >(s) -> push_back( 3 );
    cout << indirect< string const >(s) -> size() << endl;
 
    MyClass mc;
 
    return 0;
}
{% endhighlight %}

输出：  
prefix  
suffix  
prefix  
1  
suffix  
prefix  
init  
suffix  
 
说明：

1. 辅助类`indirect<T>`在调用T的成员函数之前和之后都会去调用指定的函数（上面的例子是proxy的构造和析构函数）。
2. 对于某个成员函数的调用，也可以简单的使用
3. 还可以继续封装，对模板类indirect增加policy以支持对prefix和suffix的行为，比如可以常用于打日志，分析性能等。
 
 
2、由于继承会先初始化基类，借助于继承体系，我们也可以实现的更灵活

- 用继承实现上述的功能

{% highlight c++ %}
#include <iostream>
#include <string>
using namespace std;
 
template<typename U>
struct proxy
{
    U& u_;
 
    proxy(U& u) : u_(u)
    {
       cout << "prefix" << endl;
    }
 
    ~proxy()
    {
       cout << "suffix" << endl;
    }
 
    U* operator -> ()
    {
       return &u_;
    }
};
 
template< typename T >
struct indirect : public proxy<T>
{
    indirect( T& t ) : proxy<T>(t) {}
};
 
int main()
{
    string s;
 
    indirect< string >(s) -> push_back( 3 );
    cout << indirect< string const >(s) -> size() << endl;
 
    return 0;
}
{% endhighlight %}

输出：  
prefix  
suffix  
prefix  
1  
suffix  
 
- 更进一步，继承体系下的执行代码的检查序列

{% highlight c++ %}
#include <iostream>
#include <string>
using namespace std;
 
template< typename Next, typename Param >
struct proxy
{
    Param param_;
    proxy( Param param ) : param_(param) {}
 
    Next operator -> ()
    {
       return param_;
    }
};
 
template< typename Next, typename Param >
struct Logger : proxy< Next, Param >
{
    Logger( Param param ) : proxy< Next, Param >( param )
    {
       cout << "begin Logger" << endl;
    }
    ~Logger()
    {
       cout << "end Logger" << endl;
    }
 
};
 
template< typename Next, typename Param >
struct Locking : proxy< Next, Param >
{
    Locking( Param param ) : proxy< Next, Param >( param )
    {
       cout << "begin Locking" << endl;
    }
    ~Locking()
    {
       cout << "end Locking" << endl;
    }
 
};
 
template< typename Start, typename Param >
struct indirect
{
    indirect( Param param ) : param_(param) {}
 
    Start operator -> ()
    {
       return Start(param_);
    }
 
    Param param_;
};
 
int main()
{
    typedef indirect< Locking< Logger<string*, string*>, string* >, string* > wrapper;
 
    string s;
 
    wrapper(&s)->push_back( 'a' );
 
    return 0;
}
{% endhighlight %}

输出：  
begin Locking  
begin Logger  
end Logger  
end Locking  
 
说明：这是依赖于继承体系下的构造函数顺序和析构函数顺序实现的，在代码执行的前后可以执行一系列独立的监控。

## `do{...}while(0);`

- 循环中可以break，退出后可以做统一处理，就像goto一样

{% highlight c++ %}
bool Execute()
{
    // 分配资源
    int *p = new int;
 
    bool bOk(true);
    do
    {
       // 执行并进行错误处理
       bOk = func1();
       if(!bOk) break;
 
       bOk = func2();
       if(!bOk) break;
 
       bOk = func3();
       if(!bOk) break;
 
       // ..........
 
    }while(0);
 
    // 释放资源
    delete p;  
    p = NULL;
    return bOk;
}
{% endhighlight %}
 
- 用于宏声明，使内容成为完整执行的语句段

`#define SAFE_DELETE(p) do{ delete p; p = NULL} while(0);`
 
~~~~
if(NULL != p)
    SAFE_DELETE(p) // 展开自动成为一个语句段
~~~~
    
如果没有用do-while，只会执行delete p; 而p = NULL；在之后必定执行，程序出错。


## 设计最少要求的泛型容器

泛型容器的实现者除了对容器的性能和可用性保证之外，还需要考虑对容纳的泛型元素T的需求，比如，有拷贝构造函数，无异常的析构等，当然，作为设计者，在实现功能的同时，如果可能的话，又要尽可能减少对元素需求的依赖，增强通用性。
 
举个例子，对于实现一个Stack，操作有：构造、析构、push、top、pop，分析需求：

~~~~
Stack( int size );                        // 分配内存，不需要构造T
~Stack();                                 // 要求T析构
void push( T const& value );              // 要求T能拷贝构造
T top();                                  // 要求T能拷贝构造
void pop();                               // 要求T析构
~~~~
 
因此，总结下来:

- 实现该Stack至少要求T支持拷贝构造和析构，但是如何才能在分配内存时不进行初始化呢？
- 注意到new的三种形态：new operator（对应delete operator）, operator new（对于operator delete） , placement new。
- 默认的new operator在分配内存的时候就完成初始化，如：`new T[size]`，但这个不适合，因为需要默认构造函数了；而operator new和placement new将分配和初始化分离，恰好能满足分配时不需要构造的需求。
 
### 实现如下：
 
{% highlight c++ %}
#include <algorithm>
 
// 构造对象时才使用 placement new:
template <class T1, class T2>
void construct (T1 &p, const T2 &value)
{
    // T must support copy-constructor
    new (&p) T1(value); 
}
 
// 显式的调用析构函数
template <class T>
void destroy (T const &t)  throw ()
{
    // T must support non-throwing destructor
    t.~T(); 
}
 
template<class T>
class Stack
{
public:
    Stack (int size=10)
       : size_(size),
       // T need not support default construction
       array_ (static_cast <T *>(::operator new (sizeof (T) * size))),
       top_(0)
    { }
 
    void push (const T & value)
    {
       // T need not support assignment operator.
       construct (array_[top_++], value);
    }
    T top ()
    {
       return array_[top_ - 1]; // T should support copy construction
    }
    void pop()
    {
       destroy (array_[--top_]);     // T destroyed
    }
    ~Stack () throw()
    {
       //剩余的元素都析构，并用operator delete释放operator new申请的内存
       std::for_each(array_, array_ + top_, destroy<T>);
       ::operator delete(array_); // Global scope operator delete.
    }
 
private:
    int size_;
    T * array_;
    int top_;
};
 
class X
{
public:
    X (int) {} // No default constructor for X.
private:
    X & operator = (const X &); // assignment operator is private
};
 
int main (void)
{
    Stack <X> s; // X works with Stack!
 
    return 0;
}
{% endhighlight %}
 
编译成功，说明Stack容器对于没有构造函数和赋值运算符的类型也支持。


## 关于new与delete

- new的3种形态: new operator、operator new、placement new
- delete的2种形态：delete operator、operator delete
 
### new operator:

- new操作符，像 `+ - * / && . :: ?:` 等操作符一样，是语言内置的，它不能被重载，不能改变其行为。
- 它的行为包括分配内存的 operator new 和调用构造函数的 placement new。
- new operator 实际上做了三件事：获得一块内存空间、调用构造函数、返回正确的指针。

如果创建的是简单类型(如char)的变量，那么第二步会被省略。

比如：
`CTest* pT = new CTest(1, 2);`

它的调用实际上等效于:

~~~~
void*  p  = operator new( sizeof(CTest) );
CTest* pT = new(p) CTest(2, 2);
~~~~
    
其中前一句是operator new分配内存，后一句是placement new调用构造函数，并返回正确的CTest*指针。
 
### operator new:

操作符new，原型为：`void* operator new(size_t size);`
            
- 它分配指定大小的内存, 可以被重载, 可以添加额外的参数, 但第一个参数必须为 size_t 。如果想定制在堆对象被建立时的内存分配过程，应该重载 operator new 函数。
- 然后使用 new operator，new operator 会调用定制的 operator new 。
- 它除了被 new operator 调用外也可以直接被调用, 如: `void* p = operator new(sizeof(CTest));`
            
这种用法和调用 malloc 一样, 只分配了sizeof(CTest)大小的内存。
 
### placement new:

置换new，它在一块指定的内存上调用构造函数, 包含头文件`<new>`之后也可以直接使用，如:`CTest* pT = new(p) CTest(2, 2);`
            
它在p这块内存上调用CTest的构造函数来初始化CTest。如果用 placement new 构造出来的对象，必须显示的调用对象的析构函数，如：（因为构造的时候是operator new创建，需要用operator delete释放，而不能用delete，需要显式的调用析构函数）｀pT->~CTest();｀ 然后释放能存， 调用 operator delete （对应于分配时的 operator new）｀operator delete(pT);｀
 
 
### delete operator:

- delete操作符，和 new operator 一样，不能被重载，不能改变其行为。
- delete operator 做的事有：调用析构函数，然后调用operator delete来释放内存，比如：`delete pT;` 它的调用实际上等效于:

~~~~
pT->~CTest();
operator delete(pT);
~~~~
 
### operator delete:

同理，对应于分配内存的 operator new，释放内存的为 operator delete ，它也可以被重载。
 
new、delete的数组操作版本：`operator new []` 和`operator delete []` 也可以直接被重载。


## 虚函数表的映射技巧

COM接口都是纯虚基类，一个组件可以实现多个COM接口，实现它的纯虚函数；而且COM接口的复用方面可以实现用包容和聚合：包容的实现比较简单，只要维护一个内部组件的接口指针即可，内部组件的接口都只有外部组件在使用，客户不直接使用；但是要实现聚合就比较麻烦，因为对客户的请求，外部组件可能直接抛出内部组件的接口，而使用这个内部组件的接口又能QueryInterface得到外部组件的接口。
 
常用的实现方式是内部组件实现“两个”IUnknown接口。其实是实现了一份IUnknown接口和一份INondelegatingUnknown接口，设计上，让它们具有相同的虚函数表结构，具体的实现可以参考《COM技术内幕》。
 
看一个例子：

{% highlight c++ %}
#include <iostream>
using namespace std;
 
struct IUnknown
{
    virtual void AddRef() = 0;
    virtual void Release( string const& s ) = 0;
    virtual void QueryInterface( int, void** ) = 0;
};
 
struct IDelegatingUnknown
{
    virtual void DelegatingAddRef() = 0;
    virtual void DelegatingRelease( string const& s ) = 0;
};
 
struct Test
    : public IDelegatingUnknown
{
    //将IDelegatingUnknown接口指针，强制转化为没有任何关系的IUnknown的接口指针
    IUnknown* GetUnknown()
    {
       return reinterpret_cast<IUnknown*>( static_cast<IDelegatingUnknown*>(this) );
    }
 
    // 实现IDelegatingUnknown接口
    virtual void DelegatingAddRef()
    {
       cout << "Delegating AddRef" << endl;
    }
 
    virtual void DelegatingRelease( string const& s )
    {
       cout << "DelegatingRelease: " << s << endl;
    }
};
 
int main()
{
    Test t;
    IUnknown* pn = t.GetUnknown();
 
    // 真正调用的是IDelegatingUnknown的虚函数实现Test::DelegatingAddRef
    pn->AddRef();
    pn->Release( "release" );
 
    return 0;
}
{% endhighlight %}

输出：  
Delegating AddRef  
DelegatingRelease: release  
 
分析：

对于`pn->AddRef();`通过IUnknown的声明可以看到，将调用虚函数表的第一个函数，但是由于pn当前真正指向的是IDelegatingUnknown的指针，因此将调用IDelegatingUnknown::DelegatingAddRef,其内存对应的值为`static_cast<IDelegatingUnknown*>(this)`，因此最终调用IDelegatingUnknown的第1个纯虚函数实现Test::DelegatingAddRef
