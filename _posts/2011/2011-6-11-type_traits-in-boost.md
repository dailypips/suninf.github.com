---
layout: article
title: type_traits in boost
category: boost
---

标准库std名字空间中已经增加了type_traits的库，基本上它与boost的type_traits库一致。现在就来介绍下type_traits的一些特点和用处，还有就是boost库中的内置的traits的使用清单，用它们来协助泛型编程，能大大提高工作效率，而且还有静态断言static_assert在编译期假设一些事情。traits常用于类型计算，策略导向，元编程。

traits是典型的元函数，`元函数`( meta-function )是指所有成员都是元数据(metadata)类。`元数据`：是指整型常量（包括bool，枚举型）以及类型。元函数内部只有对元数据的操作。整型常量和typedef类型分别用一个常值和一个类型来初始化，定义之后就不会再改变，因此可以作为在编译期计算的类型。如果你熟悉tuple，你应该对元函数和元编程比较了解。

例如：

{% highlight c++ %}
template< typename T >
struct Traits //成员都是编译期能够计算的对象。
{
	enum{ bRef = is_reference< T >::value };
	static const bool bPointer = is_pointer< T >::value;
	typename remove_reference<T>::type Ref;
};
{% endhighlight %}

相对于元函数来说，输入是模板参数；输出是元数据成员（当然也可以有其他成员，但是只有元数据在编译期计算，其他的是在运行期计算的）

泛型编程（写出的代码可以和任何一种符合一系列要求的数据类型一起工作）已经成为提供可复用代码的高品位选择。但是，有时泛型编程中的“泛型”却不够好——有时不同类型之间的区别太大了，无法提供高效的泛型实现。这就是 traits 技术大展身手的时候 —— 通过将那些需要考虑的基于 type by type 的属性封装在一个 traits 类中，我们可以将不得不在不同类型间有所区别的代码量减到最小，并将泛型代码量增到最大。

在 Boost type_traits 库中写了一套非常详细的 traits classes（特征类），每一个封装一个 C++ 类型系统的单一特征。这些 type-traits 类共享一个统一的设计：如果这个类型具有特定的属性，则从类型 true_type 继承，否则从 false_type 继承。就像我们将要展示的，这些类可以用在泛型编程中，用于确定一个特定类型的属性，并引入最适合那种情况的优化。

true_type和false_type是基于常整型特征类integral_constant实现的。

实现：

{% highlight c++ %}
template <class T, T val>	// T作为模板参数，为整型类型
struct integral_constant
{
   typedef integral_constant<T, val>  type; // 代表自身类型
   typedef T                     value_type;
   static const T value = val;
};
typedef integral_constant<bool, true>  true_type;
typedef integral_constant<bool, false> false_type;
{% endhighlight %}

integral_constant的使用只要提供整型类型的整型常量值，如

~~~~
integral_constant< int, 5 >::value_type就是int类型
integral_constant< int, 5 >::value 为5
true_type::value_type的类型bool，true_type::value为true
~~~~

## 代表性的traits模板类实现
 
从可能是库中最简单的类 `is_void<T>` 开始，只有当 T 为 void，`is_void<T>` 才从 true_type 继承。

~~~~
template <typename T> struct is_void : public false_type{};
template <> struct is_void<void> : public true_type{}; 
~~~~

从true_type继承，就得到了成员value为true ( 另外两个信息type为true_type和value_type为bool是不用的信息 )，而从false_type继承，得到的value为false。

这里定义了模板类 is_void 的一个主体版本，并提供了一个 T 为 void 时的完全特化。虽然模板类的完全特化是一项重要的技术，但是有时我们需要一个位于完全泛化和完全特化之间的解决方案。这正好就是标准委员会定义的 partial template-class specialization（模板类偏特化）的用武之地。例如，考虑类 `boost::is_pointer<T>`：我们需要一个主体版本用来处理 T 不是一个指针时的所有情况，和一个偏特化版本用来处理 T 是一个指针时的所有情况：

~~~~
template <typename T> struct is_pointer : public false_type{};
template <typename T> struct is_pointer<T*> : public true_type{};
~~~~

和完全特化一样，为一个类写一个偏特化，你必须先声明主体模板。偏特化在类名之后有一个额外的 `<...>` 用来包含偏特化参数，这些表明这个类型将被绑定到偏特化版本而不是缺省版本。对于什么东西能够出现在偏特化版本中的规则多少有些费解，但是作为一条经验法则，如果你能写出如下形式的两个合法的函数重载：

~~~~
void foo(T);
void foo(U);
~~~~

你就能写出如下形式的偏特化： 

~~~~
template <typename T>
class c{ /*details*/ };
template <typename T>
class c<U>{ /*details*/ };
~~~~

举一个更复杂的偏特化的例子，考虑类 `remove_extent<T>`。这个类只定义一个唯一的 typedef 成员 type，它和 T 是同一个类型，但会移除任何顶层数组的界限，这是一个在一个对某个类型执行转换的 traits 类的例子：

{% highlight c++ %}
template <typename T> 
struct remove_extent
{ typedef T type; };

template <typename T, std::size_t N> 
struct remove_extent<T[N]>
{ typedef T type; };
{% endhighlight %}

remove_extent 的目的是：设想一个泛型算法被传递过来一个数组类型作为模板参数，remove_extent 提供了一个检测这个数组的底层类型的手段。例如 `remove_extent<int[4][5]>::type` 会被检测出类型 int[5]。这个例子也展示了偏特化中的模板参数的个数和缺省模板中的个数不必相同。但是，出现在类名后面的参数的个数和类型必须和缺省模板的参数的个数和类型相同。


### type traits用于编译时的优化决策

先看一下标准库的iterator的五个类型：

{% highlight c++ %}
struct input_iterator_tag {};
struct output_iterator_tag {};
struct forward_iterator_tag : public input_iterator_tag {};
struct bidirectional_iterator_tag : public forward_iterator_tag {};
struct random_access_iterator_tag : public bidirectional_iterator_tag {};
{% endhighlight %}

然后看一下iterator_traits：

{% highlight c++ %}
template <class Iterator>
struct iterator_traits {// 每个自己定义的迭代器也要定义这五个类型属性
  typedef typename Iterator::iterator_category iterator_category;
  typedef typename Iterator::value_type        value_type;
  typedef typename Iterator::difference_type   difference_type;
  typedef typename Iterator::pointer           pointer;
  typedef typename Iterator::reference         reference;
};

template <class T>
struct iterator_traits<T*> { //对指针类型的特化
  typedef random_access_iterator_tag iterator_category; //指针是随机访问迭代器
  typedef T                          value_type;
  typedef ptrdiff_t                  difference_type; // ptrdiff_t 与size_t一直
  typedef T*                         pointer;
  typedef T&                         reference;
};
template <class T>
struct iterator_traits<const T*> { //const指针
  typedef random_access_iterator_tag iterator_category;
  typedef T                          value_type;
  typedef ptrdiff_t                  difference_type;
  typedef const T*                   pointer;
  typedef const T&                   reference;
};
{% endhighlight %}


利用iterator_traits对不同的迭代器类型（random_access_iterator_tag）进行策略导向，比如：

{% highlight c++ %}
template <class BidirectionalIterator, class Distance>
inline void __advance(BidirectionalIterator& i, Distance n, 
                      bidirectional_iterator_tag) {
  if (n >= 0)
    while (n--) ++i;
  else
    while (n++) --i;
}
template <class RandomAccessIterator, class Distance>
inline void __advance(RandomAccessIterator& i, Distance n, 
                      random_access_iterator_tag) {
  i += n;
}

template <class InputIterator, class Distance>
inline void advance(InputIterator& i, Distance n) {
  typename iterator_traits<InputIterator>::iterator_category iterator_category_tag;
  __advance(i, n, iterator_category_tag()); // 根据迭代器类型，策略最优化导向调用
}
{% endhighlight %}

### 引用的 Pair
 
type traits 的另一个重要用途是是允许那些如果不使用额外的偏特化就无法编译的代码能够编译。通过将偏特化委托给 type traits 类，就可能做到这一点。我们为这种使用方式提供的示例是一个可以持有引用的 pair 。

首先，我们先检查一下 std::pair 的定义，为了简单，我们忽略比较操作符，缺省构造函数和模板拷贝构造函数：

{% highlight c++ %}
template <typename T1, typename T2> 
struct pair 
{
    typedef T1 first_type;
    typedef T2 second_type;
    T1 first;
    T2 second;
    
    pair(const T1 & nfirst, const T2 & nsecond)
    :first(nfirst), second(nsecond) { }
};
{% endhighlight %}

现在，这个 "pair" 不能持有引用作为它的当前支点，因为这样一来构造函数就要接受一个引用的引用，这在当前是非法的。

我们来考虑一下为了让 "pair" 持有非引用类型，引用，和常引用，构造函数的参数必须是什么样的：  
type traits 类提供了一个转换 add_reference( 一个经过特化的traits类 )，它可以为一个类型加上引用，除非它已经是一个引用。   
这就允许我们创建一个可以包含非引用类型，引用类型，和常引用类型的 pair 的主模板的定义： 

{% highlight c++ %}
template <typename T1, typename T2> 
struct pair 
{
    typedef T1 first_type;
    typedef T2 second_type;
    T1 first;
    T2 second;
    
    pair(add_reference<const T1>::type nfirst, add_reference<const T2>::type nsecond)
    :first(nfirst), second(nsecond) { }
};
{% endhighlight %}

|---
| T1的类型 | const T1 的类型 | `add_reference<const T1>::type`的类型
|-|:-|:-:|-:
| `T` | `const T` | `const T &`
| `T &` | `T &` | `T &`
| `const T &` | `const T &` | `const T &`

注意：`T&` 用const 修饰还是`T&`，因为引用必须初始化，而一旦初始化引用某个对象是已经确定了，不能再改变的，也就是T&是本身是const的，可以用简单的程序测试，如：

~~~~
template< typename T >
void Test()
{
	cout << is_same<const T, T>::value << endl;
}
// Test< int& >(); 将输出1
~~~~

再加上标准的比较操作符，缺省构造函数，和模板拷贝构造函数（都和原来的一样），你就有了一个能够持有引用类型的 std::pair了。

上述同样的扩展可以使用 pair 的模板偏特化来做到，但要这样特化 pair，一共需要三个偏特化，外加主模板。

- type traits 允许我们定义一个单一的主模板，它可以调整自己像变魔术一样变成以上任何一个偏特化，而不需要强制的偏特化步骤。
- 以这种方式使用 type traits 允许程序员将偏特化委托给 type traits 类，任意转化为对应的需要的什么类型，使得代码易于维护和理解。
- 模板使得 C++ 能够利用泛型编程带来的代码复用的好处，同时泛型编程也并非最不常用的特性，而且模板可以和泛型一样精彩。


## 下面分类对boost中的每一个traits进行分析：

### 对类型分类
 
这些 traits 用来判断某个类型 T 是哪“种”类型。它们又分为两组：primary traits 全都是互斥的，而 composite traits 是一个或更多个 primary traits 的合成。

对于任何给定类型，只能有一个 primary type trait 从 true_type 继承，所有其它的都从 false_type 继承，换句话说，这些 traits 是互斥的。

这就意味着对于内建类型，在任何时候，`is_integral<T>::value` 和 `is_floating_point<T>::value` 都只有一个为 true，如果你要检查一个行为“类似”整数或浮点数类型的用户定义类类型，那么就使用 `std::numeric_limits` template 来代替。

概要： 

`is_array<T>`
: 判断是否是数组类型(可以有修饰符const常值, volatile被多线程访问变量)，`is_array<T>`具有的属性：

1. 从true_type或者false_type继承的type（要看T的类型而定，是true_type或false_type本身）和 value_type（bool）。
2. 定义的const bool值value为true或者false，依T的类型而定。

`is_class<T>`
: 由struct或class定义的类（可有cv修饰），则`is_class<T>`从true_type继承，value为true

`is_enum<T>`
: 由enum定义的枚举类型（可有cv修饰），则`is_enum<T>`从true_type继承

`is_floating_point<T>`
: 是否为浮点型，如float,double,long double等时，`is_floating_point<T>`从从true_type继承

`is_function<T>`
: 是否是函数类型，如int (char); typedef void func(int);的func函数类型，不包括函数指针或者函数引用。

~~~~
typedef int f1();      // f1 是函数类型。
typedef int (*f2)();   // f2 是函数指针。
typedef int (&f3)();   // f3 是函数引用。
// 指针和函数可以用is_pointer, is_reference判断
~~~~

使用：`is_function< func >`从true_type继承； `is_function< int(&) (double) >`从false_type继承；

如果你要检测某个类型是不是一个指向函数的指针，那就使用：

`is_function<remove_pointer<T>::type>::value && is_pointer<T>::value`

`is_integral<T>`
: 如果 T 是一个（可能被 cv 修饰的）整形类型，则从 true_type 继承，否则从 false_type 继承。

`is_member_function_pointer<T>`
: 如果 T 是一个（可能被 cv 修饰的）指向成员函数的指针，则从 true_type 继承，否则从 false_type 继承。

例如：`is_member_function_pointer<int(MyClass::*)(void)>` 从 true_type 继承。

`is_member_object_pointer<T>`
: 如果T是（可能被cv修饰的）指向成员对象（数据成员）的指针，则从 true_type 继承，否则从 false_type 继承。

例如：`is_member_object_pointer<int(MyClass::*)>` 从 true_type 继承。

`is_pointer<T>`
: 如果 T 是一个（可能被 cv 修饰的）指针类型（包括函数指针，但指向成员的指针除外），则从 true_type 继承，否则从 false_type 继承。

`is_reference<T>`
: 如果 T 是一个引用指针类型，则从 true_type 继承，否则从 false_type 继承。

`is_union<T>`
: 如果 T 是一个（可能被 cv 修饰的）union type（联合类型），则从 true_type 继承，否则从 false_type 继承

`is_void<T>`
: 如果 T 是一个（可能被 cv 修饰的）void 类型，则从 true_type 继承，否则从 false_type 继承。


下面的 traits 由一个或更多个类型分类结合而成。一个类型除了一个主分类之外，还可能属于多个这种分类。

`is_arithmetic`
: 如果 T 是一个（可能被 cv 修饰的）算术类型，则从 true_type 继承，否则从 false_type 继承。算术类型包括整数和浮点类型（参见 is_integral 和 is_floating_point）。

`is_compound`
: 如果 T 是一个（可能被 cv 修饰的）复合类型，则从 true_type 继承，否则从 false_type 继承。不是基本类型的任何类型都是一个复合类型（参见 is_fundamental）。

`is_fundamental`
: 如果 T 是一个（可能被 cv 修饰的）基础类型，则从 true_type 继承，否则从 false_type 继承。基础类型包括整型，浮点型和 void 类型（参见 is_integral, is_floating_point 和 is_void）。

`is_member_pointer`
: 如果 T 是一个（可能被 cv 修饰的）指向成员（既包括函数也包括数据成员）的指针，则从 true_type 继承，否则从 false_type 继承。

可以用is_member_object_pointer和is_member_function_pointer模拟，例如：

{% highlight c++ %}
template< typename T >
struct is_member_pointer // 自己定义traits时可以借助已有的boost的traits来组装功能
{
	enum{ value = is_member_function_pointer<T>::value || is_member_object_pointer<T>::value };
	typedef integral_constant<bool, value> type;
	typedef bool value_type;
};
{% endhighlight %}


`is_object`
: 如果 T 是一个（可能被 cv 修饰的）对象类型，则从 true_type 继承，否则从 false_type 继承。除引用，void，和函数类型以外的其它所有类型都是对象类型。

`is_scalar`
: 如果 T 是一个（可能被 cv 修饰的）scalar type（标量类型），则从 true_type 继承，否则从 false_type 继承。scalar type（标量类型）包括整型，浮点型，枚举型，指针类型，和指向成员的指针类型。


### 下面的模板描述了一个类型的常规属性。

下面的一些traits不常用的，意思也很好理解，这里不做说明了。

~~~~
alignment_of;
has_new_operator;
has_nothrow_assign;
has_nothrow_constructor;
has_nothrow_default_constructor;
has_nothrow_copy;
has_nothrow_copy_constructor;
has_trivial_assign;
has_trivial_constructor;
has_trivial_default_constructor;
has_trivial_copy;
has_trivial_copy_constructor;
has_trivial_destructor;
has_virtual_destructor;
is_abstract;
is_empty;
is_stateless;
is_polymorphic;
~~~~

`is_const`
: 如果 T 是一个（顶层的）被 const 修饰的类型，则从 true_type 继承，否则从 false_type 继承。

`is_pod`
: 如果 T 是一个（可能被 cv 修饰的）POD 类型，则从 true_type 继承，否则从 false_type 继承。

POD 表示 "Plain old data"。算术类型，枚举类型，指针和指向成员的指针都是 PODs。类和联合中如果没有引用或非 POD 类型等非静态数据成员，没有用户定义的构造函数，没有用户定义的赋值操作符，没有私有或保护的非静态数据成员，没有虚拟函数，而且没有基类，那么它们也可以是 POD 的。最后，一个带有 cv 修饰的 POD 依然是一个 POD，同样，也有 PODs 的数组。(pod的拷贝可以用内存拷贝操作memcpy, memset等)

`is_signed`
: 如果 T 是一个有符号整数类型或是一个底层为有符号整数类型的枚举类型，则从 true_type 继承，否则从 false_type 继承。

`is_unsigned`
: 如果 T 是一个无符号整数类型或一个底层为无符号整数类型的枚举类型，则从 true_type 继承，否则从 false_type 继承。

`is_volatile`
: 如果 T 是一个（顶层的）被 volatile 修饰的类型，则从 true_type 继承，否则从 false_type 继承。

`extent`

{% highlight c++ %}
template <class T, std::size_t N = 0> // N范围： 0 ～ rank-1
struct extent : public integral_constant<std::size_t, EXTENT(T,N)> {};
// 设 EXTENT(T,N) 是类型为T 的第 N 个数组维的元素的个数，类模板 extent 从 integral_constant<std::size_t, EXTENT(T,N)> 继承。
// 如果 T 不是一个数组类型，或者 N > rank<T>::value，那么 EXTENT(T,N) 为 0。

// 例如：
extent<int[1]> // 从 integral_constant<std::size_t, 1> 继承，默认N为0
extent<double[2][3][4], 1>::type // 是 integral_constant<std::size_t, 3> 类型。 
{% endhighlight %}

`rank`
: 设 RANK(T) 是类型为 T 的数组的维数，类模板 rank 从 `integral_constant<std::size_t,RANK(T)>` 继承。如果 T 不是数组类型，那么 RANK(T) 为 0。

例如：

~~~~
rank<double[2][3][4]>::type 是 integral_constant<std::size_t,3> 类型。
rank<int[][2]>::value 是求值为 2 的 integral constant expression（整常表达式）。
~~~~


### 这些模板确定在两个类型之间是否有关系：

- `is_base_of`

~~~~
template <class Base, class Derived>
struct is_base_of;
~~~~

如果 Base 是类型 Derived 的基类，或者两个类型相同，则从 true_type 继承，否则从 false_type 继承。这个模板可用于检测非公有基类，和 ambiguous base classes（歧义基类）。  
注意，`is_base_of<X,X>` 总是从 true_type 继承。甚至在 X 不是一个类类型时也是如此。这是 Boost-1.33 为了符合 C++ 库扩展技术报告而做的行为上的更改。

- `is_virtual_base_of`

~~~~
template <class Base, class Derived>
struct is_virtual_base_of;
~~~~

如果 Base 是类型 Derived 的虚拟基类，则继承自 true_type，否则继承自 false_type.

- `is_convertible`

~~~~
template <class From, class To>
struct is_convertible;
~~~~

如果一个类型为 From 的 imaginary lvalue（假想左值）可以转换为类型 To，则从 true_type 继承，否则从 false_type 继承。隐式转换的，继承使得指针可以转换的都可以用is_convertible测试。

- `is_same`

~~~~
template <class T, class U>
struct is_same;
~~~~

如果 T 和 U 是相同的类型，则从 true_type 继承，否则从 false_type 继承。


### 下面的模板基于一些良好定义的规则，将某种类型转换成另一种

每一个模板只有一个单独的名为 type 的成员，它是将转换应用到模板参数 T 上之后得到的结果。

`add_const`
: 对于所有的 T 与 T const 类型相同。

`add_cv`
: 对于所有的 T 与 T const volatile 类型相同。

`add_pointer`
: 与 `remove_reference<T>::type*` 类型相同。去引用再增加一层指针。

`add_reference`
: 如果 T 不是一个引用类型，则是 `T&`，否则是 T。

`add_volatile`
: 对于所有的 T，与 T volatile 类型相同。注意：`add_volatile<int&>::type` 还是`int&`（与const类似）。

`decay`
: 设 U 为 `remove_reference<T>::type` 的结果，则若 U 为数组类型，则结果为 `remove_extent<U>*`，否则若 U 为函数类型则结果为 `U*`，否则结果为 U。


|---
| 表达式 | 结果类型
|-|:-|:-:|-:
| `decay<int[2][3]>::type` | `int[2]*` 
| `decay<int(&)[2]>::type` | `int*` 
| `decay<int(&)(double)>::type` | `int(*)(double)` 
| `int(*)(double` | `int(*)(double)` 
| `int(double) ` | `int(*)(double)` 


`floating_point_promotion`
: 如果类型为 T 的右值可以提升为浮点数，则对 T 进行浮点数提供并保持 T 的cv限定符，否则 T 保持不变。引用不能提升，float提升为double。

`integral_promotion`
: 如果可以对类型 T 的一个右值进行整型提升，则对 T 进行整型提升并保持 T 的cv限定符，否则保持 T 不变。引用不能提升，提升为int。

`make_signed`
: 如果 T 是一个有符号整数类型，则结果类型与 T 相同，如果 T 是一个无符号整数类型，则结果为相应的有符号类型。否则，如果 T 是一个枚举类型或字符类型(char 或 wchar_t)，则结果为与 T 相同宽度的有符号整数类型。

`make_unsigned`
: 如果 T 是一个无符号整数类型，则结果类型与 T 相同，如果 T 是一个有符号整数类型，则结果为相应的无符号类型。否则，如果 T 是一个枚举类型或字符类型(char 或 wchar_t)，则结果为与 T 相同宽度的无符号整数类型。如果 T 带有cv限定符，则结果类型也有。要求：T 必须是整数或枚举类型，且不能是类型 bool。

`promote`
: 如果可以对类型 T 的右值进行整数或浮点数类型提升，则对 T 进行整数或浮点数类型提升，并保持 T 的cv限定符，否则保持 T 不变。参见 integral_promotion 和 floating_point_promotion。

`remove_all_extents`
: 如果 T 是一个数组类型，则移除 T 上的所有数组界限，否则保留 T 不变。

`remove_const`
: 与 T 的类型相同，但移除了任何顶层 const 修饰符。


|---
| 表达式 | 结果类型
|-|:-|:-:|-:
| `remove_const<int>::type` | `int` 
| `remove_const<int const>::type` | `int` 
| `remove_const<int const* const>::type` | `int const*` 
| `remove_const<int const&>::type` | `int const&` 
| `remove_const<int const*>::type` | `int const*` 

注：

- `int const* const` 第一个const修饰int，第二个const修饰指针。
- `int const&`比较复杂，这个const表示int值不变，而引用的顶层const是引用自身的特点，无法移除。

`remove_cv`
: 与 T 的类型相同，但移除了任何 顶层 cv 修饰符。

`remove_extent`
: 如果 T 是数组类型，则移除最顶层数组界限，否则保留 T 不变。

例如：

~~~~
remove_extent<int[2][4]>::type 为int[4]
remove_extent<int[][2]>::type 为int[2]
~~~~

`remove_pointer`
: 与 T 的类型相同，但移除了任何指针修饰成分，（对于指针类型，移除一层`*`）。

`remove_reference`
: 与 T 的类型相同，但移除了任何引用修饰成分。

`remove_volatile`
: 与 T 的类型相同，但移除了任何 顶层 volatile 修饰符。

### 解析函数类型

~~~~
template <class T>
struct function_traits;
~~~~

类模板 function_traits 从函数类型（参见 is_function）中提取信息。这个 traits 类允许你知道一个函数持有多少个参数，那些参数的类型是什么，以及返回类型是什么。

function_traits 只能用于形如 `R ()`, `R( A1 )`, `R ( A1, ... )`等等的C++函数，而非函数指针或类成员函数。要将函数指针转换为适用的类型，请使用 remove_pointer。

使用：

|---
| 成员 | 说明
|-|:-|:-:|-:
| `function_traits<T>::arity` | 一个给出 function type（函数类型）F 接收的参数的个数的 integral constant expression（整常表达式）
| `function_traits<T>::result_type` | function type（函数类型）F 的返回类型
| `function_traits<T>::argN_type` | 当 `1 <= N <= arity of F` 时，function type（函数类型）F 的第 N 个参数类型

~~~~
function_traits<long (int)>::arity  -> 一个值为 1 的 integral constant expression（整常表达式）。 
function_traits<long (int)>::result_type  -> 类型 long. 
function_traits<long (int, long, double, void*)>::arg4_type  -> 类型 void*. 
~~~~