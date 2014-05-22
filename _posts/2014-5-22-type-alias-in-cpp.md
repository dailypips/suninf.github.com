---
layout: article
title: C%2b%2b0x: Type Alias and Alias Template
category: C++
description: Type alias is a name that refers to a previously defined type (similar to typedef), and alias template is a name that refers to a family of types.
---
*Type alias is a name that refers to a previously defined type (similar to typedef), and alias template is a name that refers to a family of types.*

## Syntax
Alias declarations are block declarations with the following syntax:
~~~ C++
using identifier = type-id;

template < template-parameter-list >
using identifier = type-id;
~~~
* identifier - the name that is introduced by this declaration
* template-parameter-list - template parameter list, as in template declaration
* type-id - abstract declarator or any other valid type-id. For alias template declaration, type_id cannot directly or indirectly refer to identifier

## Explanation
1. A type alias declaration introduces a name which can be used as a synonym for the type denoted by type-id. It does not introduce a new type and it cannot change the meaning of an existing type name. There is no difference between a type alias declaration and typedef declaration.
2. An alias template is a template which, when specialized, is equivalent to the result of substituting the template arguments of the alias template for the template parameters in the type-id

The type produced when specializing an alias template is not allowed to directly or indirectly make use of its own type:
{% highlight c++ %}
template <class T> struct A;
template <class T> using B = typename A<T>::U; // type-id is A<T>::U

template <class T> struct A 
{
    typedef B<T> U;
};
B<short> b; // error: B<short> uses its own type via A<short>::U
{% endhighlight %}

Alias templates are never deduced by template argument deduction when deducing a template template parameter. It is not possible to partially or fully specialize an alias template.


## Example
{% highlight c++ %}
// (1)
template<typename T> using ptr = T*; 
// the name 'ptr<T>' is now an alias for pointer to T
ptr<int> ptr_int;

// (2)
template<class T> struct Alloc {};
template<class T> 
using Vec = vector<T, Alloc<T>>;
// Vec<int> is the same as vector<int, Alloc<int>>
Vec<int> v; 
{% endhighlight %}


