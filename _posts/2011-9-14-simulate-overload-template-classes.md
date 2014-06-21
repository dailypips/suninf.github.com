---
layout: article
title: 模拟“类模板名重载”
category: c++
description: 函数支持重载，这样相同的函数名可以共用，只要参数不一致就能成为重载函数，特别是功能类似的函数的时候，这样的重载来表达是非常合适的；同样道理，如果有类模板，如果功能类似，但是可能操作的对象数目不一致，即模板参数数目不完全一致，怎么共用一个名字来表达呢?
---
*函数支持重载，这样相同的函数名可以共用，只要参数不一致就能成为重载函数，特别是功能类似的函数的时候，这样的重载来表达是非常合适的；同样道理，如果有类模板，如果功能类似，但是可能操作的对象数目不一致，即模板参数数目不完全一致，怎么共用一个名字来表达呢？*
 
## 类模板名重载
由于类是不支持重载的，只能通过**默认模板参数**和**构造模板特化**来实现类似的行为，例如：  
{% highlight c++ %}
#include <iostream>
using namespace std;
 
struct dummy {};
 
// transform
template< typename T, typename U, typename na = dummy > // 默认参数dummy
struct transform ;
 
template< typename T, typename U, typename OP >
struct transform
{
    void apply( T const& t, U const& u )
    {
       OP()(t, u);
    }
};
 
template< typename T, typename OP >
struct transform<T, OP, dummy> // 特化
{
    void apply( T const& t )
    {
       OP()( t );
    }
};
 
// functor
struct func
{
    template<typename T>
    void operator() ( T ) const
    {
       cout << "void operator() ( T )" << endl;
    }
 
    template<typename T, typename U>
    void operator() ( T, U ) const
    {
       cout << "void operator() ( T, U )" << endl;
    }
};
 
int main()
{
    transform<int, double, func>().apply(2, 3.14);
 
    transform<int, func>().apply(2);
 
    return 0;
}
输出：
void operator() ( T, U )
void operator() ( T )
{% endhighlight %}

说明：
1. 默认模板参数是为了达到重载的效果，即看起来是不同数量的模板参数
2. 模板特化是为了针对不同情况实现不同的功能

