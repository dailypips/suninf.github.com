---
layout: article
title: ref in boost
category: c++
---
boost::ref是为了实现模板推断过程中的实现通用的引用方式传递，以减少拷贝带来的副作用。

## 背景
模板函数的推断中，对于普通的模板参数，推断出的是普通的类型，不是引用类型，这就导致额外的拷贝性能流失，例如：
{% highlight c++ %}
template< typename T >
void fun( T t )
{
	cout << t << endl;
}
{% endhighlight %}

当调用时，`fun( string("hello") );` T被推断为string，有拷贝。

为了减少拷贝，我们可以显式的写上引用：
{% highlight c++ %}
template< typename T >
void fun2( T const& t )
{
    cout << t << endl;
}
{% endhighlight %}


## 模板参数传递的boost.Ref使用

### 使用：`boost::ref` 或者 `boost::cref`
{% highlight c++ %}
string s("hello");
fun( boost::ref( s ) );

fun( boost::cref( string("hello") ) );
{% endhighlight %}

* ref/cref的区别是cref还可以接受临时对象，但是ref不可以。
* 不过以ref和cref传递的参数都不会被修改。也就是说：传递不会被修改的参数时，可以使用ref/cref来包装。

### ref和cref的实现：
{% highlight c++ %}
template<class T> class reference_wrapper
{ 
public:
    typedef T type;

    explicit reference_wrapper(T& t): t_(boost::addressof(t)) {}

    operator T& () const { return *t_; }

    T& get() const { return *t_; }

    T* get_pointer() const { return t_; }

private:

    T* t_;
};

// 两个函数
template<class T> 
inline reference_wrapper<T> BOOST_REF_CONST ref(T & t)
{ 
    return reference_wrapper<T>(t);
}

template<class T> 
inline reference_wrapper<T const> BOOST_REF_CONST cref(T const & t)
{
    return reference_wrapper<T const>(t);
}
{% endhighlight %}

### 返回对象的引用 boost::unwrap_ref  
如果是普通对象，直接返回该对象的引用，如果是`reference_wrapper<T>`对象，则返回`T&`，这样可以修改该值，例如：
{% highlight c++ %}
#include <iostream>
#include <boost/ref.hpp>

using namespace std;

template<typename T>
void fun( T t )
{
    boost::unwrap_ref( t ) = 10;
}

int main()
{
    int n = 0;
    boost::unwrap_ref( n ) = 5;
    cout << n << endl; // 5
    
    fun( boost::ref(n) );
    cout << n << endl; // 10
    
    return 0;
}
{% endhighlight %}

注：boost::bind源码中自己实现了一个unwrapper用于解开`reference_wrapper<T>`对象，以便操作其值。

## 总结
* 对于模板函数参数类型声明，如果对象要被修改的，声明为`T&`，如果对象仅作为使用参数而传递的，使用`T const&`
* 对于其他声明为T的传值类型的，比如标准库的算法find_if最后的参数是一个谓词函数对象，但可能也有不少需要拷贝的成员，这时，调用可以使用boost::ref
* 对于boost::bind，它的参数是通过传值拷贝的，就算被绑定的函数声明为引用，也不会影响到实参，这时对于引用的参数，我们需要使用boost::ref，例如

{% highlight c++ %}
#include <iostream>
#include <string>
#include <boost/ref.hpp>
#include <boost/bind.hpp>

using namespace std;

void fun( int& a, int b )
{
    a += b;
    cout << a << endl;
}

int main()
{
    int m = 1;
    boost::bind( &fun, m, 2 )();
    cout << m << endl; // 1
    
    int n = 1;
    boost::bind( &fun, boost::ref(n), 2 )();
    cout << n << endl; // 3
    return 0;
}
{% endhighlight %}
