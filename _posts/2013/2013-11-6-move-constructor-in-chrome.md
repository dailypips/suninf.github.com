---
layout: article
title: Move Constructor in chrome
category: chrome
---
Move constructor is a idiom in C++ for efficiency( use move if possible instead of copy ), this article introduce the implement of `move constructor` in chrome source code ( [**move.h**{: style="color:#2970A6"}](http://src.chromium.org/viewvc/chrome/trunk/src/base/move.h){: target="_blank"} ).


* Move constructor is used to transfer the ownership of a resource held by an object to another object in C++03 effectively.
* **Note:** In C++11, move-constructors are implemented using the built-in rvalue reference feature.

## An implemnt of `move constructor` in chrome:
{% highlight c++ linenos %}
// move.h
#ifndef BASEMOVE_H
#define BASEMOVE_H

#define MOVE_ONLY_TYPE_FOR_CPP_03(type, rvalue_type) \
 private: \
struct rvalue_type { \
	explicit rvalue_type(type* object) : object(object) {} \
	type* object; \
}; \
	type(type&); \
	void operator=(type&); \
 public: \
 operator rvalue_type() { return rvalue_type(this); } \
 type Pass() { return type(rvalue_type(this)); } \
 private:

#endif//BASEMOVE_H
{% endhighlight %}

We see that the `MOVE_ONLY_TYPE_FOR_CPP_03` macro has 4 parts:

1. rvalue_type typedef: can hold the host type
2. host defines private reference copy constructor and assign operator
3. host can auto convert to rvalue_type
4. Pass() method:
    * host should implement constructor with argument of rvalue_type, which is the key of `MOVE semantic`
    * Pass() return `type(rvalue_type(this))` which is a temporary, it don't match type&, so as to auto convert to rvalue_type


## Example:
{% highlight c++ %}
#include "move.h"

#include <vector>
#include <algorithm>
#include <iostream>

class Foo
{
	MOVE_ONLY_TYPE_FOR_CPP_03(Foo, RValue);

public:
	Foo(){}

	Foo(RValue other)
	{// finally using vector::swap
		// move ownership from other
		std::swap( m_vect, other.object->m_vect );
		std::swap( std::vector<int>(),
		    other.object->m_vect );
	}

	Foo& operator=(RValue rhs)
	{
		if ( this != rhs.object )
		{
			std::swap( m_vect, rhs.object->m_vect );
			std::swap( std::vector<int>(),
			    rhs.object->m_vect );
		}
		return *this;
	}

	void insert(int n)
	{
		m_vect.push_back(n);
	}

	void print()
	{
		std::for_each(m_vect.begin(), m_vect.end(), [=](int n)
		{
			std::cout << n << " ";
		});
		std::cout << std::endl;
	}

private:
	std::vector<int> m_vect;
};


int main()
{
	Foo a;
	a.insert(5);
	a.insert(6);

	Foo b;
	b.insert(7);

	b = a.Pass();

	std::cout << "a:\n";
	a.print();

	std::cout << "b:\n";
	b.print();

	return 0;
}
{% endhighlight %}

The Output:

a:


b:
5 6


Thus,  we see that the content of a has moved to b.





