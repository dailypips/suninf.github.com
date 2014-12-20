---
layout: article
title: C++转型运算及其扩展
category: c++ 
---
*本文整理了C++的转型运算，以及扩展常用的转型功能。*

## C++转型运算

### dynamic_cast

具有动态多态特征的类型（具有virtual虚函数的）的继承体系中类型之间的转型，一般使用指针转型，因为使用引用转型会抛异常。

例子：
{% highlight c++ %}
#include <iostream>
using namespace std;
 
struct A
{
    virtual void print() { cout << "A" << endl; }
};
 
struct B
{
    virtual void print() { cout << "B" << endl; }
};
 
struct C : public A, public B
{};
 
int main()
{
    C c;
    A& ra = c;
    B* pb = &c;
 
    B* p1 = dynamic_cast<B*>( &ra );
    if ( p1 )
    {
       cout << "OK 1" << endl;
       p1->print();
    }
 
    A* p2 = dynamic_cast<A*>( pb );
    if ( p2 )
    {
       cout << "OK 2" << endl;
       p2->print();
    }
 
    C* p3 = dynamic_cast<C*>( p2 );
    if ( p3 )
    {
       cout << "OK 3" << endl;
       p3->B::print();
 
       B* p4 = dynamic_cast<B*>( p3 );
       if ( p4 )
       {
           cout << "OK 4" << endl;
           p4->print();
       }
    }
 
    return 0;
}
{% endhighlight %}

输出：  
OK 1  
B  
OK 2  
A  
OK 3  
B  
OK 4  
B  
 
### static_cast

- **常用于将基类指针转化为派生类指针，如果知道指针确实对应着派生类对象，这也是递归模板范式中转型的基础。**（如果不指向派生类对象，转型是不安全的，另外static_cast不做运行期检查，编译期确定的，执行效率高，而dynamic_cast做运行期检查）

例子1：
{% highlight c++ %}
#include <iostream>
using namespace std;
 
struct A {};
 
struct B : public A
{
    void print() { cout << "B" << endl; }
};
 
int main()
{
    B b;
    A& a = b;
 
    B& rb = static_cast<B&>( a );
    rb.print(); // 输出B
 
 
    return 0;
}
{% endhighlight %}
 
例子2：静态多态
{% highlight c++ %}
template <class Derived>
struct Base
{
    void interface()
    {
       // ...
       static_cast<Derived*>(this)->implementation();
       // ...
    }
 
    static void static_func()
    {
       // ...
       Derived::static_sub_func();
       // ...
    }
};
 
struct Derived : Base<Derived>
{
    void implementation();
    static void static_sub_func();
};
{% endhighlight %}

例子3：
{% highlight c++ %}
#include <iostream>
#include <string>
using namespace std;
 
struct HashString : public string
{
    operator size_t()
    {
       size_t value = 0;
       int size  = (int)string::size();
       if (size > 6)
       {
           const char* pInfo = c_str();
           for (int idx = 6; idx < size; idx += 1)
           {
              value = 13 * value + *(pInfo + idx);
           }
       }
       return value;
    }
};
 
// reinterpret_cast内存对齐，const_cast转型拷贝，不影响原数据
HashString GetHashString( string const& str )
{
    return *(static_cast<HashString*>(const_cast<string*>(&str)));
}
 
int main()
{
    cout << GetHashString( "sjw" ) << endl;
    cout << (size_t)GetHashString( "zhenshan" ) << endl;
    return 0;
}
{% endhighlight %}

输出：  
sjw  
1371  
 
 
- **对整型转换等（从大类型转小类型）**

如:

~~~~
double d = 3.14;
int n = static_cast<int>( d );
~~~~
 
- **转型不能去除const, volatile等属性**
 
### const_cast

移除类型的const,volatile属性：

{% highlight c++ %}
#include <iostream>
using namespace std;
 
struct Num
{
    Num(int val = 0) : num(val) {}
 
    void reduce() const
    {
       const_cast<int&>(num)--; // 移除const属性
 
       cout << num << endl;
    }
 
    void Set( int val )
    {
       num = val;
       cout << num << endl;
    }
 
    int num;
};
 
void SetNum( Num const& num, int val )
{
    // 移除const属性来调用非const成员，能引起副作用
    const_cast<Num*>(&num) -> Set(val); }
 
int main()
{
    Num n(10);
    n.reduce();
 
    SetNum( n, 5 );
 
    return 0;
}
{% endhighlight %}

输出：  
9  
5  
 
### reinterpret_cast

允许任意的整形转化为任意的指针类型，所以很容易类型不安全，尽量少的使用它
 
 
## 构建好的用户接口的转型实例：

### implicit_cast

{% highlight c++ %}
#include <iostream>
#include <string>
using namespace std;
 
 
// From::operator To()
// To::To( From const& )
template<typename T, typename U>
T implicit_cast( U const& t )
{
    return t;
}
 
struct From {};
 
// construct implicite cast
struct To
{
    To( From const& f ) {}
};
 
// operator T
struct OperTo {};
 
struct OperFrom
{
    operator OperTo() const {return OperTo();}
};
 
int main()
{
    To t = implicit_cast<To>(From());
 
    OperTo ot = implicit_cast<OperTo>( OperFrom() );
 
    return 0;
}
{% endhighlight %}
 
### str_cast

用模板封装，构建良好的用户转型界面，最终比较适合的是函数模板，当然类模板定义operator T的方式也行，不过泛型化程度不够高的，比如ATL中的字符串转型CA2W等

{% highlight c++ %}
#include <iostream>
#include <string>
using namespace std;
 
template<typename T, typename U>
struct str_cast_calc;
 
template<typename T>
struct str_cast_calc<T,T>
{
    static T const& eval_r( T const& t )
    {
       return t;
    }
};
 
template<>
struct str_cast_calc<string,wstring>
{
    static string eval_r( wstring const& t )
    {
       // calc...
       return string();
    }
};
template<>
struct str_cast_calc<wstring,string>
{
    static wstring eval_r( string const& t )
    {
       // calc...
       return wstring();
    }
};
 
template<typename T, typename U>
struct str_cast_helper
{
    str_cast_helper( U const& t ) : t_(t)
    {}
    operator T() const
    {
       return str_cast_calc<T,U>::eval_r(t_);
    }
    U const& t_;
};
 
template<typename T, typename U>
T str_cast( U const& t )
{
    return str_cast_helper<T,U>(t);
}
 
 
int main()
{
    string s = "sjw";
    wstring ws = str_cast<wstring>( s );
 
    return 0;
}
{% endhighlight %}