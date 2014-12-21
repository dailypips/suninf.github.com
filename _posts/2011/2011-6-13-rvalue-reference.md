---
layout: article
title: C++0x 右值引用
category: c++
---
本文详细介绍下C++0x的右值引用的语言特性。

## 左值与右值的区分

1. 左值与右值是表达式的属性，而不是对象的属性。例如：
    * `obj, *ptr, ptr[index], vect[n], ++i`等表达式都是左值；
    * 而`1, x+y, i++, string(“zhenshan”)`等都是右值。
2. 左值是指某个表达式，它指定一个对象（对象的名字可有可无），并且该对象的生命期在该表达式语句之后。右值是指某个表达式，它指定的对象是临时的，即在表达式结束后，对象被销毁。
 
 
## 右值引用的由来和主要解决问题
举个例子：
{% highlight c++ %}
vector<int> v;
// …
v = vector<int>(10,1);
{% endhighlight %}

注意到在C++0x之前，只有`const &`才能绑定临时对象，既然是const，我们将无法修改这个绑定临时对象的变量，也就是上面的赋值语句其实是调用 `vector<int>& operator= ( const vector<int>& )`，容器内容完全的拷贝 ；另一方面，**既然这个对象是临时的，我们本可以嵌入式的提取**临时`vector<int>(10,1)`的几个指针，据为己有，因为反正这个临时变量，马上就会被析构的。
 
所以，右值引用主要就是**解决一个拷贝效率低下的问题**，因为针对于右值，或者打算更改的左值，我们可以采用类似与auto_ptr的move（移动）操作，大大的提高性能（ move semantics ）。
 
另外，C++的模板推断机制为参数`T&&`做了一个例外规则，让左值和右值的识别和转向(forward)非常简单，帮助我们写出高效并且简捷的泛型代码（perfect forwarding）。
 
 
## 右值引用初始化过程的说明
语法：`Type&& rval_ref = rval; // 注意rval只能是右值`
 
最初的C++0x打算让右值引用初始化可以绑定到左值，但是产生一个安全隐患，将它限制了，请参考：[《A Safety Problem with RValue References (and what to do about it)》](http://www.open-std.org/JTC1/SC22/WG21/docs/papers/2008/n2812.html)

### 注意事项：
* 初始化参数rval必须是右值，可以是临时对象，如果想用左值去初始化，需要用`std::move`将它变成无名的右值引用，而无名的右值引用是右值。

* 初始化后rval_ref引用地址说明：
    * 对于是临时对象的右值，不会有任何问题；
    * 对于基本内置类型的，如int，double，char等，rval_ref自己引用一块新的内存地址，比如：
        {% highlight c++ %}
        int a = 5;
        int && b = move(a);
        // a和b的地址不同，对a，b的改变也不会相互影响；
        {% endhighlight %}
        
* 对于类型对象，如vector, string，自定义类型等产生的对象，就像左值引用的行为一样，共用相同的地址，
{% highlight c++ %}
string s = "zhenshan";
string&& t = move(s);// s和t的地址一样，对其中一方改变当然也就会影响另一方。
{% endhighlight %}

* 初始化完成后，rval_ref是一个左值！（命名的右值引用是左值），以后要作为右值使用它的话，需要用move( rval_ref )得到。
 
 
## 右值引用函数参数类型

### 普通非模板函数

如：`void f( Type&& t )`

* 与初始化一致，t只能接受右值
* 注意：在函数f内部，t是一个左值，想要用到使用右值的场合，需要用move
* 假设存在重载函数 `void f( const Type& t0 )`，由于该参数t0能接受任何类型的参数`（Type, const Type, Type&, const Type&）`，但是对于右值Type类型会优先选择`Type&&`的参数的函数。
 
### 模板函数
C++0x给了模板函数的`T&&`的参数形式特殊的参数推断规则：  
设T为模板参数，`T&&`为模板函数的参数，如果实参是类型为A的左值，则T被推断为`A&`，形参类型`T&&`也为`A&`；如果实参是类型为A的右值，则T被推断为A，形参类型`T&&`为`A&&`。
 
根据这个规则，我们可以看一下，标准库的两个函数：
{% highlight c++ %}
template< class T >
typename remove_reference<T>::type&& move( T&& t )
{
    return (typename remove_reference<T>::type&&)t;
}

// 注意：有名的右值引用是左值；无名的右值引用是右值
template< class T >
void swap( T& a, T& b )// move代替copy的高效实现
{
    T tmp( move(a) );
    a = move(b);
    b = move(tmp);
}
{% endhighlight %}
 
分析：  
{% highlight c++ %}
string s = "sjw";
string t = "zhenshan";
swap( s, t );
{% endhighlight %}

首先看一看函数move：

1. 如果实参是一个右值（临时参数），如 `move( string(“yes”) )`;，T推断为string，右值引用t用`string(“yes”)`完成初始化，在函数内部t是左值，需要强制转化为`typename remove_reference<T>::type&&`类型，得到无名的右值引用，它是一个右值。
 
2. 在swap内部，`move(a)`，a是`string&`类型，根据特殊规则，T推断为`string&`，由于范围类型是`typename remove_reference<T>::type&&`，即`string&&`，因此，返回类型也为无名的右值引用，它是一个右值。总之，move能从左值得到右值，同时又支持右值。
 
3. 如果T类型的拷贝构造函数和赋值运算符都有如：`T( T&& )` 和 `T& operator=( T&& )`的形式，则tmp调用移动语义的拷贝构造函数，接下来的两个赋值也是调用移动语义的赋值运算符，特别是当拷贝 T类型对象耗效率时，这种move语法能大大提高效率。
 

## class定义类时新的注意点
如果类型Type的拷贝动作有潜在的效率问题，如list, vector, string等，我们就需要定义右值引用参数的移动拷贝构造函数（move constructor）和移动赋值运算符（move assignment operator）：
{% highlight c++ %}
class Type
{
public:
    Type( const Type& );
    Type( Type&& );
    Type& operator = (const Type& );
    Type& operator = ( Type&& );
};
{% endhighlight %}

这样，当我们用右值对Type对象初始化或者赋值时，就是主动选择参数为`Type&&`的版本的函数（特别注意对于左值，如果知道可以对它破坏，就可以选择move函数调用传递的形式 ）。
 
**编译器关于move constructor和move assignment operator的规则**：

1. move constructor和move assignment operator不会默认生成。
2. 隐式的默认构造函数（即不写无参数的构造函数）会被move constructor阻止。
3. 隐式的默认构造函数不会被move constructor阻止。即如果不显式写`Type( const Type& )`，这个构造函数能默认生成。
4. 隐式的默认赋值运算符不会被move assignment operator阻止。即如果不显式写，会默认生成。
 
 
## perfect forwarding，泛型编码转向的一种新思路
考虑下面的情况：  
外部函数调用的内部函数有很多重载;  
怎么样简捷的实现外部函数，并支持内部函数的所有类型?  
 
( 注意：由于右值引用初始化无法绑定左值，现有的文献上所说的 Identity，Forward需要改写，因为`Forward<Type>`当Type是右值传入时会涉及初始化右值引用，而传入的参数都是左值，会导致失败，我用add_reference和Forward模拟了限制右值引用初始化绑定左值的情况下的实现 )

{% highlight c++ %}
#include <iostream>
#include <boost\type_traits.hpp>
using namespace std;
 
template< class T >
T&& Forward( typename boost::add_reference<T>::type&& t ) 
{// 要求显式提供模板参数
 // 注意T可能为非引用或左引用类型，
 // 参数也可为typename boost::remove_reference<T>::type& t
    return (T&&)t;
}
void inner( int&, int& ) 
{ 
    cout << __FUNCSIG__ << endl; 
}
void inner( int&, const int& ) 
{ 
    cout << __FUNCSIG__ << endl; 
}
void inner( const int&, int& ) 
{ 
    cout << __FUNCSIG__ << endl; 
}

void inner( const int&, const int& ) 
{ 
    cout << __FUNCSIG__ << endl; 
}
 
template< class T1, class T2 >
void outter( T1&& t1, T2&& t2 )
{// 基本想法：编译器自动参数识别，类型和值信息保存和转换
    inner( Forward<T1>( t1 ), Forward<T2>( t2 ) );
}
int main()
{// 测试自动类型识别
    int a = 1;
    const int b = 2;
    outter( a, a );
    outter( b, b );
    outter( 1, 1 );
    outter( a, b );
    outter( b, a );
    outter( a, 1 );
    outter( 1, a );
    outter( b, 1 );
    outter( 1, b );
    return 0;
}

// 输出：  
// void __cdecl inner(int &,int &)  
// void __cdecl inner(const int &,const int &)  
// void __cdecl inner(const int &,const int &)  
// void __cdecl inner(int &,const int &)  
// void __cdecl inner(const int &,int &)  
// void __cdecl inner(int &,const int &)  
// void __cdecl inner(const int &,int &)  
// void __cdecl inner(const int &,const int &)  
// void __cdecl inner(const int &,const int &)  
{% endhighlight %}


 
可以看出，利用模板和右值引用函数参数的特殊规则，可以简捷而准确的识别类型：

1. 用函数模板，函数参数用`T&&`的格式，这样能让编译器自动准确识别T类型
2. 用T特化`std::forward`，并让`T&&`的形参（这是是右值）传入，然后就Okay啦。
 
 
## 关于函数返回值非引用的说明
在C++0x之前，由于局部变量不能引用传出来，因为临时对象会消失。
但是，现在有了右值引用的机制，比如：

{% highlight c++ %}
#include <iostream>
#include <boost\type_traits.hpp>
using namespace std;
 
class A
{
    friend ostream& operator << ( ostream& out, const A& a ) 
    { 
        out << a.str_; return out; 
    }
    
public:
    A( const string& str="zhenshan" ) : str_( str ) {}
    
    A( const A& a ) : str_( a.str_ ) 
    {
        cout << __FUNCSIG__ << endl; 
    }
    
    A& operator=( const A& a ) 
    { 
        str_ = a.str_; 
        cout << __FUNCSIG__ << endl; 
        return *this; 
    }
    
    A( A&& a ) : str_( move(a.str_) )
    { 
        cout << __FUNCSIG__ << endl;  
    }
    
    A& operator=( A&& a ) 
    { 
        str_ = move( a.str_ ); 
        cout << __FUNCSIG__ << endl; 
        return *this; 
    }
        
private:
    string str_;
};
 
A funcMove() 
{//只要这样写函数就行了，因为A类型自带了move操作的性质
     A tmp;
     return tmp;
}
 
A funcCopy( const A& a )
{// 返回左值，对于返回类型是A的（临时对象）右值，初始化使用 copy constructor
    return a; 
}
 
A& funcLRef( A& a )
{// 返回左值，返回结果左值引用，会进行一次左值引用初始化
    return a;
}
 
int main()
{
    A a = funcMove(); // 两次move构造函数被优化为一次
    A b = funcCopy( a );
    funcLRef( a ) = A( "yes" );
    
    cout << "a = " << a << endl;
    cout << "b = " << b << endl;
 
    return 0;
}

// 输出：
// __thiscall A::A(class A &&)
// __thiscall A::A(const class A &)
// class A &__thiscall A::operator =(class A &&)
// a = yes
// b = zhenshan
{% endhighlight %}

## 在C++0x环境下关于自定义类的move语义注意事项
Perfect Forwarding是重载函数类型准确识别和转调用的很好的机制，但使用显然没有move语义的拷贝构造函数和赋值运算符用的不知不觉和无声无息。
右值引用的move语义是非常重要的特征！
 
自定义类时的基本原则，在以下情况时，最好重载move语义的拷贝构造函数和赋值运算符：

1. 维护一个指针成员，于是涉及到copy构造为深拷贝（指向内容的拷贝）和move（指针的交换，转移等，视实现而定）
2. 具有vector, list, string等标准库容器的数据成员的，需要重载move语义。因为标准库容器已经根据右值引用的新特征进行了改写
3. 包含了其他自定义类，而该自定义类具有move语义
 
补充：如果仅仅包含一些不具有move语义的数据成员（内置类型int，double，自定义类等等），就没有必要使用move语义。因为这些对象本身没有可以被move的”特征”，只能被拷贝。