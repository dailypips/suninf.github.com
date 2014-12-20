---
layout: article
title: Expression Templates 表达式模板
category: c++ 
---

### 表达式模板的目标是：

- 创建C++中的嵌入式语言，boost.proto为我们搭好了这个框架，boost.xpressive就是嵌入C++的正则表达式，可以静态的生成正则表达式引擎，所有的正则表达式运算都被重载。boost.spirit也是嵌入C++的语言，可以直接用于EBNF语法解析，json_spirit就是使用它的Classic库实现的。
- 延迟计算。表达式在真正需要计算的时候才计算，如lambda表达式的实现和高效的科学计算的延迟计算。
- 传递表达式，并非表达式的值，而是表达式类型的对象。
 
### 表达式模板之实现核心思想：

1. 用模板类来表示一个表达式运算，并且重载常见的语言中的求值运算，如`operator()` lambda表达式, `operator[]` 科学计算等，即表达式可（调用）计算，而模板参数通常表示子表达式类型。
2. 重载相应的运算符，如`operator +，*，=`（注：operator=只能作为成员函数重载）等所有可以重载的运算符，只要有意义的都需要重载，通常返回表示表达式的模板类对象。即运算符重载仅返回可调用的对象而不进行计算。
 
## 例程：

### 实现简单的lambda表达式
 
{% highlight c++ %}
#include <boost/mpl/bool.hpp>
#include <boost/utility/enable_if.hpp>
#include <boost/type_traits.hpp>
 
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
 
// 表达式的统一基类
template<typename T>
struct Expr
{
    operator const T&() const
    {
        return static_cast<const T&>( *this );
    }
};
 
template< typename T >
struct is_expr
{
    // 继承自Expr<T>或者自身的就为表达式
    typedef typename boost::is_base_of< Expr<T>, T >::type type;
};
 
// 常数包装
template<typename T>
struct ValueExpr :
    Expr< ValueExpr<T> >
{
    T const& val_;
 
    ValueExpr( T const& val )
        : val_(val)
    {}
 
    template< typename U >
    T operator()( U const& ) const
    {
        return val_;
    }
};
 
// 定义加法表达式operator +
template< typename A, typename B >
struct AddExpr :
    Expr< AddExpr<A, B> >
{
    A left_;
    B right_;
 
    AddExpr( A const& lhs, B const& rhs )
        : left_(lhs), right_(rhs)
    {}
 
    template<typename T>
    T operator()( T& val ) const
    {
        return left_(val) + right_(val);
    }
};
 
template< typename T, typename U >
inline AddExpr<T, U> operator+( Expr<T> const& lhs, Expr<U> const& rhs )
{
    return AddExpr< T, U >( lhs, rhs );
}
 
// 使用disable_if 强制T类型必须非表达式类型，用于模板函数重载过滤
template< typename T, typename U >
inline typename boost::disable_if< typename is_expr<T>::type, AddExpr<ValueExpr<T>, U>  >::type
operator+( T const& lhs, Expr<U> const& rhs )
{
    return AddExpr< ValueExpr<T>, U >( lhs, rhs );
}
 
template< typename T, typename U >
inline typename boost::disable_if< typename is_expr<U>::type, AddExpr<T, ValueExpr<U> > >::type
operator+( Expr<T> const& lhs, U const& rhs )
{
    return AddExpr< T, ValueExpr<U> >( lhs, rhs );
}
 
// 定义赋值表达式operator =
template<typename A, typename B>
struct AssignOp :
    Expr< AssignOp<A, B> >
{
    B right_;
 
 	// 这里的rhs很有可能是临时的，离开作用域会出错
    AssignOp( B const& rhs ) 
        : right_(rhs)
    {}
 
    template< typename T >
    T& operator()( T& val )
    {
        return A()(val) = right_(val);
    }
};
 
// placeholder 赋值表达式的左值
template<typename T>
struct VariantHolder :
    Expr< VariantHolder<T> >
{
    T& operator()( T& val ) const
    {
        return val;
    }
 
    template<typename U>
    AssignOp<VariantHolder<T>, U>
        operator= ( Expr<U> const& expr )
    {
        return AssignOp<VariantHolder<T>, U>( expr );
    }
 
    AssignOp<VariantHolder<T>, ValueExpr<T> >
        operator= ( T const& val )
    {
        return AssignOp<VariantHolder<T>, ValueExpr<T> >( val );
    }
};
 
int main()
{
    int v[] = { 1, 2, 3, 4, 5 };
    copy( v, v+5, ostream_iterator<int>(cout, " ") );
    cout << endl;
 
    // 生成lambda表达式用于算法
    VariantHolder<int>      iVar; // placeholder
 
    for_each( v, v+5, iVar = iVar + 10 ); // assign lambda
    copy( v, v+5, ostream_iterator<int>(cout, " ") );
    cout << endl;
 
    // 再加
    transform( v, v+5, v, iVar + 10 ); // add lambda
    copy( v, v+5, ostream_iterator<int>(cout, " ") );
    cout << endl;
 
    // 更复杂的表达式
    VariantHolder<string>   sVar;
    string s = "hello";
    (sVar = sVar + string(" world"))( s );
    cout << s << endl;
 
    s = " world";
    (sVar = string("hello") + sVar )( s );
    cout << s << endl;
 
    s = "hello";
    (sVar = sVar + sVar + string("~yeah~") )( s );
    cout << s << endl;
 
    s = "hello";
    (sVar = sVar + string("~yeah~") + sVar )( s );
    cout << s << endl;
    return 0;
}
{% endhighlight %}

输出：  
1 2 3 4 5  
11 12 13 14 15  
21 22 23 24 25  
hello world  
hello world  
hellohello~yeah~  
hello~yeah~hello  
 
 
### 实现一个延迟计算的数组

{% highlight c++ %}
#include <assert.h>
#include <iostream>
#include <iterator>
#include <algorithm>
using namespace std;
 
// 表达式基类, T为最终表达式计算的值的类型
// 增加T是为了operator+/*自动推断
template<typename T, typename E>
struct Expr
{
    operator E const& () const
    {
        return static_cast<E const&>(*this);
    }
 
    T operator[] ( int n ) const
    {
        E const& expr = static_cast<E const&>(*this);
        return expr[n];
    }
};
 
// 二元运算符包装器
template<typename T, typename A, typename B, typename OP>
struct BinaryExpr :
    public Expr< T, BinaryExpr<T, A, B, OP> >
{
    A const& left;
    B const& right;
 
    BinaryExpr( A const& lhs, B const& rhs ) :
    left(lhs), right(rhs)
    {}
 
    T operator[] ( int n ) const
    {
        return OP::apply( left, right, n );
    }
};
 
// 加法运算
struct AddOP
{
    template<typename T, typename A, typename B>
    static T apply(Expr<T,A> const& lhs, Expr<T,B> const& rhs, int n )
    {
        return lhs[n] + rhs[n];
    }
};
 
// 乘法运算
struct MultOP
{
    template<typename T, typename E>
    static T apply( Expr<T,E> const& lhs, T const& rhs, int n )
    {
        return lhs[n] * rhs;
    }
};
 
// operator+
template< typename T, typename A, typename B >
BinaryExpr<T, A, B, AddOP>
operator + ( Expr<T, A> const& lhs, Expr<T, B> const& rhs )
{
    return BinaryExpr<T, A, B, AddOP>(lhs, rhs);
}
 
// operator*
template<typename T, typename E>
BinaryExpr<T,E,T,MultOP>
operator * ( Expr<T,E> const& expr, T const& val )
{
    return BinaryExpr<T,E,T,MultOP>( expr, val );
}
 
template<typename T, typename E>
BinaryExpr<T,E,T,MultOP>
operator * ( T const& val, Expr<T,E> const& expr )
{
    return BinaryExpr<T,E,T,MultOP>( expr, val );
}
 
// 缓式计算的表达式数组
template<typename T>
class Array :
    public Expr< T, Array<T> >
{
public:
    Array(int n, T const& val = T()) :
      dim_(n), pval_( new T[n] )
      {
          for ( int i=0; i<dim_; ++i )
          {
              pval_[i] = val;
          }
      }
 
      ~Array()
      {
          delete []pval_;
      }
 
      template<typename E>
      Array& operator = ( Expr<T, E> const& expr )
      {
          for ( int i=0; i<dim_; ++i )
          {// 此时整个表达式expr才计算
              pval_[i] = expr[i]; 
          }
          return *this;
      }
 
      T const& operator[](int n) const
      {
          assert( 0<=n && n<dim_ );
          return pval_[n];
      }
 
      T& operator[](int n)
      {
          assert( 0<=n && n<dim_ );
          return pval_[n];
      }
 
      T* begin() { return pval_; }
      T* end() { return pval_ + dim_; }
 
private:
    int dim_;
    T *pval_;
};
 
int main()
{
    Array<int> A(3), B(3), C(3, 2), D(3, 3);
    B[0] = 1, B[1] = 2, B[2] = 3;
 
    // 整个表达式的延迟计算
    A = 2 * (B + C * 3) + D;
 
    copy( A.begin(), A.end(), ostream_iterator<int>(cout, " ") ); // 17 19 21
 
    return 0;
}
{% endhighlight %}

输出：  
17 19 21  