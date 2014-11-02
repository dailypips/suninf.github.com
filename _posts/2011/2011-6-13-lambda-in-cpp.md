---
layout: article
title: C++0x lambda表达式
category: c++
description: 本文详细介绍下C++0x的lambda表达式的语言特性。
---
*本文详细介绍下C++0x的lambda表达式的语言特性。*

## lambda表达式总体特点：

1. **Lambda函数作为临时的函数，最常要数用于STL算法了**，我们的很多STL算法可以指定一个函数参数，比如：accumulate, for_each,  find_if, count_if, search, mismatch, sort等几十个算法函数。C++0x以前我们必须用有名的函数或者函数对象（bind,not等组合）来作为参数，现在无名的Lambda函数直接简单的嵌入到代码中了，方便简洁。
2. 除了STL算法，当我们需要简单的函数，并且只在作用域出现不多次时，我们就可以直接**用auto存储Lambda函数对象**，避免使用有名的函数放到外层作用域。
3. **利用boost的function库，我们可以保存同一类型的多个Lambda的函数对象**，放到标准容器中，在局部生成lambda函数也能来实现回调。

## 语法解析

### 语法：  
`[capture-list] ( argument-list ) -> ReturnType { function-body } `

* capture-list：捕捉当前域的变量，捕捉的变量可以在函数体中使用。[]代表Lambda表达式的开始。  
**规则**：  
`[]`：外部当前域的所有变量均不可见  
`[&]`: 能引用使用当前域的所有变量  
`[=]`：非引用，只读当前域的所有变量  
`[ name1, &name2, &name3, name4 ]`：指定部分名字可见，其中name2, name3引用，所以能改变其内容，name1, name4只读。（多个名字逗号分开，需要引用则前面加上`&`）。
      [this]：可以绑定this，在类中可以取用当前类的成员。

* argument-list：参数列表，与普通函数的声明一致。

* `->ReturnType`：指定返回类型，此项一般可以忽略，忽略时按照return的值的类型推断返回类型（没有return返回void）

* function-body：函数体，与普通函数一致

### C++14 的lambda新语法特征

* lambda捕捉域变量初始化（Initialized Lambda Captures）
{% highlight c++ %}
int x = 4;
auto y = [&r = x, x = x+1]()->int {
    r += 2;
    return x+2;
}();
// x:6, y:7
{% endhighlight %}

* 范型lambda表达式（**Generic (Polymorphic) Lambda Expressions**）  
`auto add = [](auto a,auto b){return a + b;}`  
auto作为参数时，成为范型的lambda函数，能直接参数推导，而不需要指定返回类型。

### lambda语句返回函数对象的操作：

1. 直接传给STL算法等可以接受函数对象的地方。
2. 直接可以调用，右边加上括号、参数 ( real-argu-list )，语法和普通函数对象一致。
3. 由于函数对象对应的类不是从标准库的unary_function, binary_function继承，所以无法使用bind1st, not1等绑定器。但是**我们有更加强大的auto或者boost的bind和function库，分别可以用来部分绑定和存储返回的函数对象**。

注：auto还有一个**延迟指定函数返回值**的功能，常用于模板函数的定义中，如：
{% highlight c++ %}
template< typename T, typename U >
auto func(T t, U u) -> typename MaxType<T,U>::type
{
    // ...
}
{% endhighlight %}

## 代码示例
* lambda函数的常用于算法和auto临时存储
{% highlight c++ %}
#include <iostream>
#include <algorithm>
#include <vector>
#include <string>
#include <iterator>
#include <boost/bind.hpp>
using namespace std;

struct BasicInfo
{
	BasicInfo( const string& name, int age ) 
		: name_(name), age_(age) {}
	string name_;
	int age_;
};

int main()
{
	vector< BasicInfo > vect;
	vect.push_back( BasicInfo("tom", 15) );
	vect.push_back( BasicInfo("Jam", 18) );
	vect.push_back( BasicInfo("Yea", 15) );	
	vect.push_back( BasicInfo("Jack", 59) );
	vect.push_back( BasicInfo("Master", 35) );

	vector<string> NamesVect(vect.size());
	int idx=0;
	for_each( NamesVect.begin(), NamesVect.end(), [&]( string& s ){ s = vect[idx++].name_; } );
	
	for_each( NamesVect.begin(), NamesVect.end(), [](const string& s){ cout << s+" "; } );
	cout << endl << "idx = " << idx << endl;

	//---------------------------------------
	idx = 0;
	vector<int> intVect;
	generate_n( back_inserter(intVect), 10, [&idx]() { return idx++; } );
	generate_n( back_inserter(intVect), 10, [&idx]() { return --idx; } );
	// 0 1 2 3 4 5 6 7 8 9 9 8 7 6 5 4 3 2 1 0
	copy( intVect.begin(), intVect.end(), 
	    ostream_iterator<int>( cout, " " ) );
	cout << endl;

	auto func = []( int n, int val ) { return val==n; };
	vector<int>::iterator pos = find_if( intVect.begin(), intVect.end(), 
		boost::bind<bool>( func, _1, 3 ) ); // 查找第一个等于3
	if( pos != intVect.end() )
	{
		cout << *pos << endl;
		cout << "index = " << pos - intVect.begin() << endl;
	}
	++pos;
	// 查找第一个3之后不等于4
	pos = find_if( pos, intVect.end(), 
		[&func](int n){ return ! boost::bind<bool>( func,_1,4 )(n); } ); 
	if( pos != intVect.end() )
	{
		cout << *pos << endl;
		cout << "index = " << pos - intVect.begin() << endl;
	}

	return 0;
}

// 输出
// tom Jam Yea Jack Master 
// idx = 5
// 0 1 2 3 4 5 6 7 8 9 9 8 7 6 5 4 3 2 1 0 
// 3
// index = 3
// 5
// index = 5
{% endhighlight %}


* 使用boost的bind和function库来操作lambda函数返回的函数对象，存储到容器
{% highlight c++ %}
#include <iostream>
#include <algorithm>
#include <vector>
#include <iterator>
#include <utility>
#include <boost/function.hpp>
#include <boost/bind.hpp>
using namespace std;

template< class T >
void Print( const T& v )
{
	typedef typename T::const_reference CValRef;
	for_each( v.begin(), v.end(), 
	    [](CValRef val){ cout << val << " "; } );
	cout << endl;
}

int main()
{
	boost::function< int(int, int) > fun = 
	    [](int x, int y){ return x*y; };
	cout << fun(3,4) << endl; // 12
	cout << 
	    boost::bind<int>([](int x, int y){return x+y;}, 5, _1)(6) 
	    << endl; // 11

	vector<int> vect;
	vect.push_back( 3 );
	vect.push_back( 5 );
	vect.push_back( 2 );	
	vect.push_back( 7 );
	vect.push_back( 3 );
	vect.push_back( 1 );

	boost::function< bool(int,int) > f = 
	    [](int x, int y) { return x<y; };
	
	sort( vect.begin(), vect.end(), f );
	Print(vect); //1 2 3 3 5 7

	sort( vect.begin(), vect.end(), boost::bind<bool>(f,_2,_1) );
	Print(vect); //7 5 3 3 2 1

	//----------------------------------
	vector<int> intTest;
	int val = 0;
	generate_n( back_inserter( intTest ), 10, 
	    [&val](){ return ++val; } );
	Print( intTest );
	vector< function<void(int&)> > funcVect;
	funcVect.push_back( [](int n){ cout << n+2<< endl; } );
	funcVect.push_back( [](int& n){
	    n = 1000; 
	    cout << n << endl; 
	});
	funcVect.push_back( [](int n){ cout << "yes" << endl; } );

	vector<int>::iterator pos = intTest.begin();
	advance( pos, 3 );
	int idx = 0;
	for_each( intTest.begin(), pos, [&]( int& n ) { 
	    return funcVect[idx++]( n ); 
	});
	Print( intTest );

	return 0;
}
{% endhighlight %}