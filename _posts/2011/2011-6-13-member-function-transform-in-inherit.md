---
layout: article
title: 继承体系下成员函数指针的转化及其调用
category: c++
description: C++相对于C增加了三种特殊运算符来支持成员指针。另外，标准C++中还有一条有趣的规则是：你可以在类定义之前声明它的成员函数指针类型。
---
*C++相对于C增加了三种特殊运算符来支持成员指针。**::\*** 用于指针的声明，而 **->\* 和 \.\*** 用来调用指针指向的函数。另外，标准C++中还有一条有趣的规则是：你可以在类定义之前声明它的成员函数指针类型。*
 
* 类型的实际对象和成员函数指针的分离也是实现委托的基础
* 下面的**消息注册与分派的实现机制**最终还是使用了成员函数指针及其调用的技巧。
 
## 同类型下，成员函数指针简单的使用：
{% highlight c++ %}
#include <iostream>
using namespace std;
 
class test;
typedef void (test::*FunType)();
 
class test
{
public:
    void print() { cout << "hello" << endl; }
};
 
int main()
{
    FunType pfun = &test::print;
    test t;
 
    (t .* pfun)();           // 输出 hello
 
    ( (&t) ->* pfun )();     // 输出 hello
 
    return 0;
}
{% endhighlight %}

 
## 继承体系下，成员函数的指针的使用
考虑如下代码：
{% highlight c++ %}
class SomeClass;
typedef void (SomeClass::* SomeClassFunction)(void);
 
void Invoke(SomeClass *pClass, SomeClassFunction funcptr)
{
    (pClass ->* funcptr)();
};
{% endhighlight %}

* 这段代码是完全合法的，尽管编译器对SomeClass类一无所知，但当传递SomeClass及其派生类对象和函数对象时，编译器能让代码正确的运行。
* 其实，针对成员函数指针的实现，各个编译器的实现各不相同，依赖于成员函数指针的很多使用是不具备移植性的，也就是说当我们在使用成员函数指针的转化时，是在使用编译器trick，尽管可能这种使用是相对通用的trick。
 
下面主要介绍继承体系下的，成员函数指针转化及调用中的事项：  

1. 成员函数指针类型转化，依赖于static_cast。
2. 一般常用的方式是，派生类指针类型转化为基类指针类型，因为派生类对象指针转化为基类对象的指针是直接的。
 
 
### 派生类成员函数指针对应的函数不是虚函数
派生类可以直接使用转化为基类的函数指针，或者对象可以转化为基类调用。

{% highlight c++ %}
#include <iostream>
using namespace std;
 
struct Base {};
 
struct Derived : public Base
{
    void print() { cout << "hello" << endl; }
};
 
typedef void (Base::*Base_Fun)();
 
int main()
{
    Derived obj;
    Base_Fun pFun = static_cast< Base_Fun >( &Derived::print );
    (obj .* pFun)();             // 派生类自己调用
    ((Base*)(&obj) ->* pFun)(); // 基类调用
 
    return 0;
}
{% endhighlight %}
 
### 基类中可以用this指针调用派生类的成员函数指针
{% highlight c++ %}
#include <iostream>
#include <map>
#include <string>
using namespace std;
 
template<typename T>
struct CBusMsgHandler
{
    typedef void (CBusMsgHandler::*Fun_Type)();
 
    CBusMsgHandler()
    {
       T & t = static_cast<T &>( *this );
       t.__RegistAll_In_Map();
    }
 
    virtual void AddRegisterMessage(string const& s, Fun_Type fun)
    {
       m_[ s ] = fun;
    }
 
    void OnMsg( string const& s )
    {
       map<string, Fun_Type>::iterator it = m_.find( s );
       if ( it != m_.end() )
       {
           (this ->* it->second)(); // 调用时，使用this指针
       }
    }
 
private:
    map<string, Fun_Type> m_;
};
 
struct derived : public CBusMsgHandler< derived >
{
    void __RegistAll_In_Map()
    {
       AddRegisterMessage( "hello", static_cast<CBusMsgHandler< derived >::Fun_Type>(&derived::print_hello) );
       AddRegisterMessage( "world", static_cast<CBusMsgHandler< derived >::Fun_Type>(&derived::print_world) );
    }
 
    void print_hello() { cout << "hello" << endl; }
    void print_world() { cout << "world" << endl; }
};
 
int main()
{
    derived data;
    data.OnMsg("hello");
 
    return 0;
}
{% endhighlight %}
 
这个例子的基本内容是：基类中存储派生类的成员函数指针（转换），当外面条件触发到基类的回调时，基类中可以使用this指针来调用存储的派生类的成员函数指针，但是效果是派生类对象的成员函数被调用，这也是消息总线的核心。
 
 
### 派生类成员函数指针对应的函数是虚函数
派生类成员函数指针对应的函数是虚函数时，它必须是基类对应函数的覆盖，即基类必须有这个虚函数的声明。否则，后果是运行时程序崩溃。

{% highlight c++ %}
#include <iostream>
using namespace std;
 
struct Base
{
    virtual void print() { cout << "world" << endl; }
};
 
struct Derived : public Base
{
    void sing() { cout << "hello world" << endl; }
    virtual void print() { cout << "hello" << endl; }
};
 
typedef void (Base::*Base_Fun)();
 
int main()
{
    Derived obj;
    Base_Fun pFun = static_cast< Base_Fun >( &Derived::print );
    ((Base*)(&obj) ->* pFun)(); // 派生类重定义，输出 hello
 
    pFun = static_cast< Base_Fun >( &Derived::sing );
    (obj .* pFun)();  // 可以混合使用，输出 hello world
 
    return 0;
}
{% endhighlight %}