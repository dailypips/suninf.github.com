---
layout: article
title: smart_ptr in boost
category: boost
---

介绍三种最常用的智能指针:

1. `shared_ptr`：对象生成期自动管理，基于共享所有权（适合用于标准库容器）
2. `weak_ptr`：安全观测共享资源，配合shared_ptr
3. `intrusive_ptr`：带有一个侵入式引用计数的对象的共享所有权。
 
## 介绍 shared_ptr( `<boost/shared_ptr.hpp>` )

### shared_ptr类的实现说明

- 主要的几种构造函数

{% highlight c++ %}
template<class Y> explicit shared_ptr(Y * p = 0);
// 注：p指向有效资源，比如 new int(5)
 
template<class Y, class D> shared_ptr(Y * p, D d); 
// d(p)形式释放资源

shared_ptr(shared_ptr const & r); // 对应shared_ptr<T>
 
template<class Y>
shared_ptr(shared_ptr<Y> const & r);//支持多态，只要Y*能转化为T*
 
template<class Y>
explicit shared_ptr(weak_ptr<Y> const & r);
// 注：从有效的观察者weak_ptr绑定资源（如果weak_ptr为空，抛出bad_weak_ptr异常）
{% endhighlight %}

比如：

{% highlight c++ %}
X * CreateX();
void DestroyX(X *);

// 可靠地销毁一个由 CreateX 返回的指针的唯一方法就是调用 DestroyX。
shared_ptr<X> createX()
{
    shared_ptr<X> px(CreateX(), DestroyX);// 释放资源制定
    return px;
}
{% endhighlight %}
 
- 其他成员函数

{% highlight c++ %}
shared_ptr & operator=(shared_ptr const & r);
 
template<class Y> shared_ptr & operator=(shared_ptr<Y> const & r);     
 
void reset();  // 指针失去当前对象所有权
 
template<class Y> void reset(Y * p);
// 注：引用数减1，绑定新资源
 
T & operator*() const;
 
T * operator->() const;
 
T * get() const;  // 返回裸指针（资源地址）
 
bool unique() const;
 
long use_count() const;  
 
operator unspecified-bool-type() const;// 代理，能用到需要bool的环境
 
void swap(shared_ptr & b);
{% endhighlight %}

- 非成员函数

{% highlight c++ %}
template<class T, class U>   
bool operator==(shared_ptr<T> const & a, shared_ptr<U> const & b);
// a.get() == b.get()
 
template<class T, class U>   
bool operator!=(shared_ptr<T> const & a, shared_ptr<U> const & b);
 
template<class T>
void swap(shared_ptr<T> & a, shared_ptr<T> & b);
 
template<class T>
T * get_pointer(shared_ptr<T> const & p); // 获取裸指针
{% endhighlight %}
 
### shared_ptr的使用

- 每一个 shared_ptr 都符合 C++ 标准库的 CopyConstructible 和 Assignable 的必要条件，因此能够用于标准库容器。同时提供了比较操作，因此 shared_ptr 可以和标准库中的关联式容器一起工作。
- 因为在实现中使用了引用计数，shared_ptr实例的循环引用不会被回收。

例子：

{% highlight c++ %}
#include <iostream>
using namespace std;
#include <boost/shared_ptr.hpp>
using namespace boost;
 
struct A
{
    A(){ cout << "A()" << endl; }
    ~A() { cout << "~A()" << endl; } // 程序结束后没有析构掉
    shared_ptr<A> ptr;
};
int main()
{
    shared_ptr<A> p( new A ); // A引用计数1
    p->ptr = p; // A引用计数2
 
    return 0;
}
{% endhighlight %}

对象p析构时，引用计数减1，然后检查发现非0，不做delete操作，于是内存泄漏。

- 不要使用匿名的shared_ptr去存储内容，因为这样容易为内存泄漏埋下隐患。

比如：

~~~~
void f( shared_ptr<int>, int ) { ... }
int g() { ... }
 
void good()
{
    shared_ptr<int> p(new int(2));
    f( p, g() );
}
 
void bad()
{
    f( shared_ptr<int>(new int(2)), g() );
}
~~~~

因为函数参数的求值顺序是不确定的，new int(2) 首先被求值，g()可能是第二个被求值，如果 g 抛出一个异常，我们永远也不可能到达 shared_ptr 的构造函数。于是内存泄漏。
 
 
## 介绍 weak_ptr( `<boost/weak_ptr.hpp>` )

### weak_ptr的实现说明

weak_ptr是shared_ptr的观察者，只是观察被共享的资源，但不会真正拥有资源（没有所有权）如果要使用资源，用lock或者shared_ptr的构造函数得到所观察资源的`shared_ptr<T>`对象。
 
- 构造函数

~~~~
weak_ptr();
 
template<class Y>
weak_ptr(shared_ptr<Y> const & r);
 
weak_ptr(weak_ptr const & r);     
 
template<class Y>
weak_ptr(weak_ptr<Y> const & r);
~~~~
 
- 成员函数

~~~~
template<class Y>
weak_ptr & operator=(shared_ptr<Y> const & r);   
 
weak_ptr & operator=(weak_ptr const & r);     
 
template<class Y>
weak_ptr & operator=(weak_ptr<Y> const & r);     
 
long use_count() const;     
 
bool expired() const;    // çè use_count() == 0，但更快
 
shared_ptr<T> lock() const;    
 
void reset();      // 不观察任何资源
 
void swap(weak_ptr<T> & b);
~~~~

- 非成员函数

~~~~
template<class T>   
void swap(weak_ptr<T> & a, weak_ptr<T> & b);
~~~~
 
 
## 介绍 intrusive_ptr

intrusive_ptr 类模板存储一个指向带有侵入式引用计数的对象的指针。

- 每一个新的 intrusive_ptr 实例都通过对函数 intrusive_ptr_add_ref 的无条件调用（将指针作为参数）增加引用计数。
- 同样，当一个 intrusive_ptr 被销毁，它会调用 intrusive_ptr_release，这个函数负责当引用计数降为 0 时销毁这个对象。

这两个函数的适当定义由用户提供。intrusive_ptr_add_ref 和 intrusive_ptr_release 应该定义名字空间 boost 中。
 
使用 intrusive_ptr 的主要原因是：

- 一些已有的 frameworks 和操作系统提供带有侵入式引用计数的对象；
- intrusive_ptr 的内存占用量和相应的裸指针一样。
- `intrusive_ptr<T>` 能够从任意一个类型为 `T *` 的裸指针构造出来。

作为一个通用规则，如果 intrusive_ptr 不是很明显地比 shared_ptr 更加适合你的需要，请首先考虑基于 shared_ptr 的设计。
 
- 构造函数

~~~~
intrusive_ptr(); // 默认，get() == 0
 
intrusive_ptr(T * p, bool add_ref = true); // add_ref默认为true
// 作用：if(p != 0 && add_ref) 调用intrusive_ptr_add_ref(p);
 
intrusive_ptr(intrusive_ptr const & r);
 
template<class Y>
intrusive_ptr(intrusive_ptr<Y> const & r);
// 作用：if(r.get() != 0)  intrusive_ptr_add_ref(r.get());
~~~~
 
- 成员函数

~~~~
intrusive_ptr & operator=(intrusive_ptr const & r);
 
template<class Y>
intrusive_ptr & operator=(intrusive_ptr<Y> const & r);
 
intrusive_ptr & operator=(T * r);
// 作用：等价于 intrusive_ptr(r).swap(*this)。
 
void reset(T * r);
T & operator*() const;
T * operator->() const;
T * get() const;
operator unspecified_bool_type () const;
void swap(intrusive_ptr & b);
~~~~

- 非成员函数

~~~~
==, !=, <, swap;
template<class T> 
T * get_pointer(intrusive_ptr<T> const & p); // 返回 p.get()
~~~~

例子：

{% highlight c++ %}
#include <iostream>
using namespace std;
 
#include <boost/intrusive_ptr.hpp>
using namespace boost;
 
// functions
template< typename T >
long intrusive_ptr_add_ref( T *p )
{
    return p->AddRef();
}
 
template<typename T>
long intrusive_ptr_release( T *p )
{
    return p->Release();
}
 
template <class T>
inline bool   intrusive_ptr_create(intrusive_ptr<T> & __t_ptr)
{
    intrusive_ptr<T> spObj(T::_CreateInstance(), false);
    __t_ptr = spObj;
    return spObj != 0;
}
 
// class
class ITest
{
public:
    ITest() : count(0) { cout << "ITest()" << endl; }
    ~ITest() { cout << "~ITest()" << endl; }
    void Doing() { cout << "doing" << endl; }
 
public:
    static ITest* _CreateInstance()
    {
       ITest* pObj = new ITest();
       pObj->AddRef();
       return pObj;
    }
    long AddRef() { return ++count; }
    long Release()
    {
       if ( --count == 0 )
       {
           delete this;// 通过new出来的对象才能这样做，栈上的不行
           return 0;
       }
       return count;
    }
private:
    long count;
};
 
int main()
{
    intrusive_ptr<ITest> pObj, pObj2, pObj3;
    if ( intrusive_ptr_create( pObj ) )
    {
       cout << "1: OK" << endl;
    }
 
    pObj2 = pObj;
    pObj->Doing();
 
    if ( intrusive_ptr_create( pObj3 ) )
    {
       cout << "3: OK" << endl;
    }
 
    return 0;
}
{% endhighlight %} 
 
 
## 智能指针编程技术

### pimpl 惯用法 -- 避免在头文件中暴露身体

例子：

{% highlight c++ %}
// 头文件.h
class example
{
public:
    example();
    void do_something();
private:
    class implementation;
    shared_ptr< implementation > _imp; // 隐藏实现细节
};
 
// 实现文件.cpp
class example::implementation
{
public:
    ~implementation() { std::cout << "destroying implementation\n"; }
};
 
example::example() : _imp( new implementation ) {}
 
void example::do_something()
{
    cout << "use_count() is " << _imp.use_count() << "\n";
}
{% endhighlight %}
 
 
### 用shared_ptr持有一个指向 COM 对象的指针

即：使用该指针，并且维持其引用计数状态，嵌入式的生成一个shared_ptr，中途持有该指针，但是对之前的代码逻辑没有影响。

COM 对象有一个嵌入式的引用计数和两个操作它的成员函数。AddRef() 增加计数。Release() 减少计数并当计数将为 0 时销毁它。

{% highlight c++ %}
shared_ptr<IWhatever> make_shared_from_COM(IWhatever * p)
{
    p->AddRef();
    shared_ptr<IWhatever> pw(p, mem_fn(&IWhatever::Release));
    return pw;
}
{% endhighlight %}

无论如何，从 pw 创建 shared_ptr 的拷贝不会在 COM 对象的嵌入计数中“登记”，它们将共享在 make_shared_from_COM 中创建的单独的引用。当最后的 shared_ptr 被销毁，从 pw 创建的 weak pointers（弱指针）将失效，无论 COM 对象本身是否还存在。
 
 
### 获得一个指向 this 的 shared_ptr

boost封装的实现, 库中现在有一个辅助类模板 enable_shared_from_this 能被用于实现这种需求的类。

例如：

{% highlight c++ %}
class X
{
public:
 
    virtual void f() = 0;
 
protected:
 
    ~X() {}
};
 
class Y
{
public:
 
    virtual shared_ptr<X> getX() = 0;
 
protected:
 
    ~Y() {}
};
 
class impl:
public X, public Y, public enable_shared_from_this<impl>
{
public:
 
    impl(impl const &);
    impl & operator=(impl const &);
 
public:
 
    virtual void f() { /* ... */ }
 
    virtual shared_ptr<X> getX()
    {
        return shared_from_this();
    }
}
{% endhighlight %}