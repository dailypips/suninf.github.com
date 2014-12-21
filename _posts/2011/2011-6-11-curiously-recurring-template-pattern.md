---
layout: article
title: 奇特的递归模板模式（CRTP）
category: c++
---
CRTP（Curiously Recurring Template Pattern）是借助模板和继承来实现的一种技巧。

## 基本特征如下：
{% highlight c++ %}
class X // 注意X本身也可以是模板类型
         : public base<X>
{
    //…
};
{% endhighlight %} 
 
1. X的基类是一个模板特化，而该模板特化的实参为X
2. X派生自一个了解自己的`base<X>`类，因此形成一种特殊的继承关系。
 
这种模式的最主要的一个功能是可以帮助自动生成成员函数，首先讲下实现这样效果的理论基础：  

- 尽管当派生类X被声明（或被实例化，若X为模板类）时，基类模板`base<X>`的声明被实例化，但是`base<X>`的成员函数的本体实例化要等到X的完整声明之后进行，也就是说，在实现基类的成员函数时，可以使用派生类的实现细节。
- 由于`struct derived : base<derived>{…}`的形式，在base成员函数体中可以把this通过static_cast转化得到派生类derived的对象，并使用其方法：`derived* p =  static_cast<derived*>( this );` 它的方法中隐含的this，就可以用于转化为真正的派生类对象。我们需要用static_cast来强制转化得到派生类对象。
- base要求模板参数T类型提供必要的“接口“，因为base的成员函数的实现会依赖这些接口。因为这些接口是base所依赖的。
 
## CRTP的能力
1. 静态多态 Static polymorphism(常用于ATL与WTL)，并且是编译期就决定调用的是基类还是派生类的方法，效率更高。
2. 承自基类，基类提供依赖派生类的实现的一系列函数，这些函数就像是定义在派生类中一样。
3. 成员函数指针的结合，可以穿透派生类的protected的方法（只有派生类的this指针和成员函数指针`->* , .*`调用可以使用基类的protected方法），实现更好的封装。
 
**注意事项：**  
被递归模板模式使用的基类模板`base<T>`中，不能使用模板参数类型T的对象，只能使用T的指针或引用，因为在base中，T的类型是不完整的，因为T还要继承自`base<T>`。

{% highlight c++ %}
template< typename T >
class base
{
    T*  m_pVal; // ok
    T   m_Val;  // error
}
 
struct test : public base<test> {}
{% endhighlight %}
 
例如：
{% highlight c++ %}
#include <iostream>
using namespace std;
 
template<class T>
class Ccounter
{
private:
    T* m_pt;  // OK
    // T m_t; // Error
    static int m_nCount;
public:
    Ccounter(){ ++m_nCount; }
    Ccounter(const Ccounter&){ ++m_nCount; }
    ~Ccounter(){ --m_nCount; }
    static int Get(){ return(m_nCount); }
};
 
template<class T>
int Ccounter<T>::m_nCount = 0;
 
class CcountInstance : public Ccounter<CcountInstance>{};
 
int main()
{
    CcountInstance a[3];
 
    cout << CcountInstance::Get() << endl;
    return 0;
}
{% endhighlight %}

 
## CRTP在封装性上的能力

###先看下简单的OOP框架下的动态多态：
{% highlight c++ %}
// Library code
class Base
{
public:
    virtual ~Base();
    
    // 实现以来于派生类实现的虚函数do_foo()
    int foo() { return this->do_foo(); }   
 
protected:
    virtual int do_foo() = 0;
};
 
// User code
class Derived : public Base
{
private:
    virtual int do_foo() { return 0; }
};
{% endhighlight %}
 
### 然后是简单的静态多态：
{% highlight c++ %}
// Library code
template<class T>
class Base
{
public:
    int foo()
    {
       T& t = static_cast<T&>(*this);
       return t.do_foo(); // 实现依赖于派生类的do_foo()，在编译期计算好
    }
    int do_foo() { } // 当派生类不实现时的默认方法。
};
{% endhighlight %}

- 编译时要求类型T具有do_foo()成员函数，否则编译失败。
- 静态多态是编译期计算的，比动态多态具有更高的效率。

{% highlight c++ %}
// User code
class Derived : public Base<Derived>
{
public:
    int do_foo() { return 0; }
};
{% endhighlight %}

**这里有个限制，要求do_foo()是public的**，因为被外面访问，但是这破坏了封装性，能否去掉限制呢？
 
1、**委托访问权限（侵入式）**  

基本想法是委托一个友元类来间接访问：

{% highlight c++ %}
#include <iostream>
using namespace std;
 
// Library code
class Accessor
{
private:
    template<class>
    friend class Base;// 仅给内部的Base传递权限
 
    template<class T>
    static int foo(T& derived)
    {
       return derived.do_foo();
    }
};
 
template<class T>
class Base
{
public:
    int foo()
    {
       T& t = static_cast<T&>(*this);
       // 通过Accessor间接访问，来调用派生类do_foo()
       return Accessor::foo(t); 
    }
};
 
// User code
class Derived : public Base<Derived>
{
private:
    // 用户被限制，一定要这样声明一下
    friend class Accessor;
    int do_foo()
    {
       cout << "hello world!" << endl;
       return 0;
    }
};
 
int main()
{
    Derived d;
    d.foo(); // 输出 hello world!
 
    return 0;
}
{% endhighlight %}
 
 
2、**几乎完美的静态封装**  

依赖于成员函数指针的技巧和访问基类的protected的特征：

{% highlight c++ %}
#include <iostream>
using namespace std;
 
// Library code
template<class T>
class Base
{
private:
    struct Accessor : T
    {
       static int foo(T& derived)
       {
           // 成员函数指针的技巧，其中Accessor写成T也是可以的
           int (T::*fn)() = &Accessor::do_foo; 
           return (derived.*fn)();
       }
    };
public:
    int foo()
    {
       T& t = static_cast<T&>(*this);
       return Accessor::foo(t); // 间接访问
    }
};
 
// User code
struct Derived : Base<Derived>
{
  protected:
      int do_foo()
      {
         cout << "hello world!" << endl;
         return 0;
      }
};
 
int main()
{
    Derived d;
    d.foo();
 
    return 0;
}
{% endhighlight %}

注意：
`int (T::*fn)() = &Accessor::do_foo;`
显然Accessor是没有do_foo()方法的，它依赖于基类T提供，不过其实也可以写成：
`int (T::*fn)() = &T::do_foo;`
然后借助成员函数指针调用以及Derived派生类声明了protected方法，从而完成调用要求。
 

## 递归模板范式的实践

### 获得成员函数
{% highlight c++ %}
#include <iostream>
#include <string>
using namespace std;
 
template< typename T >
struct base
{
    bool operator > ( T const& rhs ) const
    {
        T const& lhs = static_cast< T const& >(*this);
        return rhs < lhs;
    }
 
    bool operator >= ( T const& rhs ) const
    {
        T const& lhs = static_cast< T const& >(*this);
        return !(rhs < lhs);
    }
 
    bool operator <= ( T const& rhs ) const
    {
        T const& lhs = static_cast< T const& >(*this);
        return !(rhs > lhs);
    }
};
 
class string_wrap :
    public base< string_wrap >
{
public:
    string_wrap( string const& s ) : str(s) {}
    bool operator < ( string_wrap const& rhs ) const
    {
        return str < rhs.str;
    }
 
private:
    string str;
};
 
 
int main()
{
    cout << 
        ( string_wrap("ABc") >  string_wrap("AB") ? "yes" : "no" ) 
        << endl;
        
    cout << 
        ( string_wrap("ABc") <= string_wrap("AB") ? "yes" : "no" )
        << endl;
        
    cout << 
        ( string_wrap("AB") >=  string_wrap("AB") ? "yes" : "no" )
        << endl;
 
    return 0;
}
{% endhighlight %}

说明：  

1. 再强调一下，使用时只使用派生类string_wrap，而不使用辅助生成成员函数的派生类模板order。
2. 基类模板可以帮助提供实现一系列方法，只要派生类满足一个最低要求，例如对于基类模板order来说，它要求派生类具有一个operator< const的方法。
 
 
### 实现一个栈上或者无名的堆上单件
{% highlight c++ %}
#include <iostream>
#include <string>
#include <assert.h>
using namespace std;
 
template<typename T>
class singleton
{
public:
    static T& Instance()
    {
       return *pInstance_;
    }
 
    static T* PtrInstance()
    {
       return pInstance_;
    }
 
public:
    singleton()
    {
       // 派生类构造过程中，基类构造时，可以获取当前的派生类对象
       // 这里使用了构造函数和this特点、奇特模板递归模式的技巧
       assert( !pInstance_ ); // 单件禁止重复生成同一类型对象
       pInstance_ = static_cast<T*>( this );
    }
    ~singleton()
    {
       assert( pInstance_ );
       pInstance_ = 0;
    }
 
protected:
    static T* pInstance_;
};
 
template<typename T>
T* singleton<T>::pInstance_ = 0; // 静态
 
 
class sing_class
    : public singleton<sing_class>
{
public:
    sing_class( string const& s )
       : str(s)
    {}
 
    template<typename T>
    void doing( T const& t )
    {
       cout << t << " " << str << endl;
    }
private:
    string str;
};
 
int main()
{
    // 生成无名的动态对象，不过对象地址可以通过PtrInstance取得
    new sing_class("sjw"); 
    sing_class::Instance().doing(0);
    delete sing_class::PtrInstance();
 
    {
       sing_class aa("zhenshan");
       aa.doing(1);
    }
    // sing_class::Instance().doing(2); 
    // 这个版本的单件，试图直接从Instance得到出错
    
    return 0;
}
{% endhighlight %}
 
### spirit.QI中实现基元分析器的示例
本质上这里的继承只是获得基类的方法，但是由于基类依赖于派生类使得事情变得很有意思。
base不直接使用，但是它提出了接口要求，只要满足最低要求，然后继承就能从它获益或者获得一些特征，比如，spirit的解析器是利用类似的继承和模板实现的，使得接口封装和使用非常的清晰方便。  

例如实现一个基元分析器需要提供几个要求：  

1. 属性元函数类sttribute
2. 给定规格的函数parse
3. 函数what
 
{% highlight c++ %}
// 首先完成实现部分
struct my_parser_impl : qi::primitive_parser< my_parser_impl >
{ // 三个成员函数
    template <typename Context, typename Iterator>
    struct attribute
    {
        typedef YourAttr type; // 指定你的分析器属性，也就是自定义类型
    };
 
    template <typename Iterator, typename Context, typename Skipper, typename Attribute>
    bool parse(Iterator& first, Iterator const& last, Context& ,
        Skipper const& skipper, Attribute& attr) const
    {
        qi::skip_over(first, last, skipper); // 先执行跳过忽略项
        // 接下来是分析任务，这里有几个任务要完成
        // （1）、判断first迭代器，并且伴随着前向迭代器first的前进，而且不会超越last
        // （2）、逐个字符解析过程中，要记录信息，因为最后要得到属性值attr
        // （3）、如果匹配成功返回true，否则为false 
    }
 
    template <typename Context>
    info what(Context& ) const
    {
        return qi::info("my_parser");
    }
};

// 然后生成真正的基元分析器类型(需要#include <boost/proto/proto.hpp>)：
// 获得成员函数成为基元终结分析器
struct my_parser : proto::terminal< my_parser_impl >::type {}; 
{% endhighlight %}
 
### 基类使用派生类的类型
也是依赖于实例化顺序，即类型和函数名是先要求实例化的，而函数体的实例化则是在派生类的类成员类型和成员函数名实例化了之后进行的，因此，可以在基类base的函数体中访问身为派生类的T的成员类型。

{% highlight c++ %}
#include <iostream>
using namespace std;
 
template<typename T>
struct base
{
    void f()
    {
       typedef typename T::item_type Item;
       Item m;
       m.n = 10;
       cout << m.n << endl;
    }
};
 
struct derived : base<derived>
{
    struct Item
    {
       int n;
    };
 
    typedef Item item_type;
};
 
int main()
{
    derived d;
    d.f();
 
    return 0;
}
{% endhighlight %}