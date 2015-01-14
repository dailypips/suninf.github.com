---
layout: article
title: C++仿函数配接器的使用
category: c++ 
---
本文介绍一些使用C++配接器以及实作仿函数的方法，要较好的使用STL中的functor，自己也要最好按照源码的标准格式写仿函数；配接器使仿函数的使用更加灵活，首先理解和使用，然后自己也学习和实作适合自己特殊要求的配接器。

## bind1st 和 bind2nd

{% highlight c++ %}
#include <iostream>
#include <functional>

using namespace std;
template< class T >
struct func : public binary_function< T, T, T>
{
    T operator () ( T t1, T t2 ) const 
    { 
        return t1-t2; 
    }
};

int main()
{
    cout << bind1st( func<int>(), 10 ) (4) << endl; //10-4
    cout << bind2nd( func<int>(), 10 ) (4) << endl; //4-10
    
    return 0;
}
{% endhighlight %}


## not1 和 not2

{% highlight c++ %}
#include <iostream>
#include <string>
#include <functional>
using namespace std;

template< class T >
struct func : public unary_function< T, bool >
{// 判断是否 a < x < b
    func(const T& a0, const T& b0) : a(a0), b(b0) { }
    bool operator () ( T x ) const
    {
        return (a<x)&&(x<b);
    }

private:
    T a;
    T b;
};

int main()
{
    cout << func<int>(5,9)( 6 ) << endl;
    cout << not1( func<int>(5,9) )(6) << endl;
    cout << func<string>("100","102")("101") << endl;
    return 0;
}
{% endhighlight %}


## mem_fun 和 mem_fun_ref 

要求成员函数无参数或者单参数

{% highlight c++ %}
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <functional>
using namespace std;

class Base
{
public:
    virtual void Print() 
    { 
        cout << "Print Base" << endl; 
    }
    virtual int Display( string s ) const
    {
        cout << "Display Base: " << s << endl;
        return 0;
    }
	virtual ~Base() {}
};

class Derived : public Base
{
public:
    void Print()
    {
        cout << "Print Derived" << endl; 
    }
    virtual int Display( string s ) const
    {
        cout << "Display Derived: " << s << endl;
        return 0;
    }
    ~Derived() {}
};

int main()
{
    vector<Base*> baseptrvector;
    baseptrvector.push_back( new Base );
    baseptrvector.push_back( new Derived );
    baseptrvector.push_back( new Derived );
    baseptrvector.push_back( new Base );
    
    for_each( baseptrvector.begin(), baseptrvector.end(),
        mem_fun( &Base::Print ) );
    cout << "//" << endl;
    
    for_each( baseptrvector.begin(), baseptrvector.end(),
        bind2nd( mem_fun( &Base::Display ), "suninf" ) );
    cout << "//" << endl;
    
    Base base;
    Derived der;
    mem_fun_ref( &Base::Print ) ( base );
    mem_fun_ref( &Base::Print ) ( der );
    
    return 0;
}
{% endhighlight %}


## ptr_fun 

将一般函数转换成功能一致但更灵活的functor

{% highlight c++ %}
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <functional>
using namespace std;

void func( string s1, string s2 )
{
    cout << s1 << " " << s2 << endl;
}

int main()
{
    vector<string> stringvector;
    stringvector.push_back( "sjw" );
    stringvector.push_back( "suninf" );
    for_each( stringvector.begin(), stringvector.end(),
        bind2nd(ptr_fun(func), "|") );
    
    return 0;
}
{% endhighlight %}



 