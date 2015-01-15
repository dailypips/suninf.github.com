---
layout: article
title: range in boost
category: boost
---

正如“Iterator Must Go”中所说，STL的算法虽然设计的高效，但是基于迭代器的算法设计使得灵活性和简洁性受到很大的限制，也阻碍了STL算法的更广泛的使用。

range设计的目的就是弥补STL的这个缺陷，用range的概念来取代用迭代器对`[first, one_past_last)`来标识区间，使得使用算法可以更加灵活和紧凑。

## Range的Concept定义

类似于STL中容器的概念，range维护了可以通过迭代器遍历的区间[first, one_past_last)，但是range对元素的要求比容器更少，只是访问而不是占有元素，本身也不具有拷贝语义（因为range不需要拷贝元素）。

基于range中迭代器遍历类型的不同（`iterator_traversal<X>::type`，新的迭代器的范畴详见“New Iterator Concepts”）。

### range也给出了不同的逐步精细的定义：

1、单遍区间（Single Pass Range）  
对于单遍区间类型X，`boost::range_iterator<X>::type`是单遍迭代器（Single Pass Iterator）的范畴。

支持正向遍历的迭代器表达式：

- `boost::begin(a)` 	：表示区间的首元素的迭代器。
- `boost::end(a)`		：表示最后元素的下一个位置的迭代器。

2、前向遍历区间（Forward Range）

`boost::range_iterator<X>::type`是一个前向迭代器（Forward Traversal Iterator）。

3、双向遍历区间（Bidirectional Range）  
boost::range_iterator<X>::type是一个双向遍历迭代器（Bidirectional Traversal Iterator）。

支持用于反向遍历的迭代器表达式：
boost::rbegin(a) 	：等价于boost::range_reverse_iterator<X>::type( boost::end(a) )
boost::rend(a)		：等价于boost::range_reverse_iterator<X>::type(boost::begin(a))

4、随机访问区间（Random Access Range）  
`boost::range_iterator<X>::type`是一个随机访问迭代器（Random Access Traversal Iterator）。

支持区间长度：`boost::size(a)`

### 区间概念检查（Concept Checking）

提供4个类用BOOST_CONCEPT_ASSERT来对对应的range的类型进行concept check。

~~~~
SinglePassRangeConcept
ForwardRangeConcept
BidirectionalRangeConcept
RandomAccessRangeConcept
~~~~

例如：

{% highlight c++ %}
typedef boost::iterator_range< std::vector<int>::iterator > RangeType;
BOOST_CONCEPT_ASSERT( ( boost::RandomAccessRangeConcept<RangeType> ) );
{% endhighlight %}


## 操作Range的功能函数及元函数

### 元函数

|---
| 表达式 | 返回类型
|-|:-|:-:|-:
| `range_iterator<X>::type` | Range的迭代器类型，有多种可能：`T::iterator, P::first_type, A*` 
| `range_iterator<const X>::type` | `T::const_iterator, P::first_type, const A*` 
| `range_value<X>::type` | `boost::iterator_value<range_iterator<X>::type>::type` 
| `range_reference<X>::type` | `boost::iterator_reference<range_iterator<X>::type>::type` 
| `range_pointer<X>::type` | `boost::iterator_pointer<range_iterator<X>::type>::type` 
| `range_category<X>::type` | `boost::iterator_category<range_iterator<X>::type>::type` 
| `range_difference<X>::type` | `boost::iterator_difference<range_iterator<X>::type>::type` 
| `range_reverse_iterator<X>::type` | `boost::reverse_iterator<range_iterator<X>::type>` 
| `range_reverse_iterator<const X>::type` | `boost::reverse_iterator<range_iterator<const X>::type` 
| `has_range_iterator<X>::type` | `mpl::true_ 如果range_mutable_iterator<X>::type 合法` 
| `has_range_const_iterator<X>::type` | `mpl::true_如果 range_const_iterator<X>::type 合法` 	
 	

### 函数

|---
| 表达式 | 返回类型 | 返回值说明
|-|:-|:-:|-:
| `begin(x)` | `range_iterator<X>::type` | `p.first 如果p为std::pair<T> ; a本身如果a为指针或数组; range_begin(x) 如果该表达式能ADL找到 ; 否则为t.begin()`
| `end(x)` | `range_iterator<X>::type` | `p.second - Pair; a + sz - 数组; range_end(x) 通过 ADL; t.end()`
| `empty(x)` | `bool` | `boost::begin(x) == boost::end(x)`
| `distance(x)` | `range_difference<X>::type` | `std::distance(boost::begin(x),boost::end(x))`
| `size(x)` | `range_difference<X>::type` | `默认boost::end(x) - boost::begin(x)；可以通过实现range_calculate_size(x) 来改变默认行为。`
| `rbegin(x)` | `range_reverse_iterator<X>::type` | `range_reverse_iterator<X>::type(boost::end(x))`
| `rend(x)` | `range_reverse_iterator<X>::type` | `range_reverse_iterator<X>::type(boost::begin(x))`
| `const_begin(x)` | `range_iterator<const X>::type` | `range_iterator<const X>::type(boost::begin(x))`
| `const_end(x)` | `range_iterator<const X>::type` | `range_iterator<const X>::type(boost::end(x))`
| `const_rbegin(x)` | `range_reverse_iterator<const X>::type` | `range_reverse_iterator<const X>::type(boost::rbegin(x))`
| `const_rend(x)` | `range_reverse_iterator<const X>::type` | `range_reverse_iterator<const X>::type(boost::rend(x))`
| `as_literal(x)` | `如果x为指向string的指针，则为iterator_range<U>，U为Char*；否则U range_iterator<X>::type` | `如果s是Char* 或Char数组：[s,s + std::char_traits<X>::length(s)) ；否则：[boost::begin(x),boost::end(x))`
| `as_array(x)` | `iterator_range<X>` | `[boost::begin(x),boost::end(x))`

例如：

{% highlight c++ %}
string s = "sjw";
boost::iterator_range<string::iterator> rg1 = boost::as_literal( s );

boost::iterator_range<char*> rg2 = 	boost::as_literal( s.c_str() );
{% endhighlight %}

## 区间配接器

Range配接器之于算法正如算法之于容器。使得算法的表达能力大大增强。

基本语法：`rng | boost::adaptors::adaptor_generator`

注意：

- adaptor_generator其实还可以使用函数调用的方法，但是简洁性不够，还是使用上面语法的`operator | ()`简洁，而且支持多个配接器组合作用。
- 另外，配合range库新增的算法如erase、push_back等操作性函数，使得`_if、_copy、_copy_if、_n`等后缀的算法可以通过组合替换而不再需要。

### 支持的配接器：

- `adjacent_filtered`

语法：`rng | boost::adaptors::adjacent_filtered(bi_pred)` 

邻接过滤，返回的range中，所有相邻的[x，y]元素，满足bi_pred(x,y)为true。

例如：

{% highlight c++ %}
int input[] = {1,1,2,2,2,3,4,5,6};
boost::copy(
	input | adjacent_filtered(std::not_equal_to<int>()),
	std::ostream_iterator<int>(std::cout, " "));
{% endhighlight %}

输出：1 2 3 4 5 6

- `copied`

语法：`rng | boost::adaptors::copied(n, m)`

取出一段子区间的元素，要求`0 <= n && n <= m && m < distance(rng)` 

- `filtered` 

语法：`rng | boost::adaptors::filtered(pred)`

对range过滤，返回range中的每个元素x，满足pred(x)为true

例如：

{% highlight c++ %}
#include <boost/range/adaptor/filtered.hpp>
#include <boost/range/algorithm/copy.hpp>

#include <algorithm>
#include <iostream>

int main()
{
	using namespace boost::adaptors;

	int input[] = {1,2,3,4,5,6,7,8,9};

	struct is_even
	{
		bool operator()( int x ) const { return x % 2 == 0; }
	};
	boost::copy(
		input | filtered(is_even()),
		std::ostream_iterator<int>(std::cout, " "));
}
{% endhighlight %}

输出：2 4 6 8

- `indexed` 

语法：`rng | boost::adaptors::indexed( N )` 

返回序列的元素从N开始进行了编号，可以通过访问返回的range的迭代器的index()方法取到对应的编号。

例如：

{% highlight c++ %}
#include <boost/range/adaptor/indexed.hpp>
#include <boost/range/algorithm/copy.hpp>
#include <algorithm>
#include <iostream>

template<class Iterator>
void display_element_and_index(Iterator first, Iterator last)
{
	for (Iterator it = first; it != last; ++it)
	{
		std::cout << "Element = " << *it << " Index = " << it.index() << std::endl;
	}
}

template<class SinglePassRange>
void display_element_and_index(const SinglePassRange& rng)
{
	display_element_and_index(boost::begin(rng), boost::end(rng));
}

int main()
{
	using namespace boost::adaptors;

	int input[] = {10,20,30,40};

	display_element_and_index( input | indexed(5) );

	return 0;
}
{% endhighlight %}

输出：  
Element = 10 Index = 5  
Element = 20 Index = 6  
Element = 30 Index = 7  
Element = 40 Index = 8  

- `indirected` 

语法：`rng | boost::adaptors::indirected` 

返回原序列元素解引用后的序列（如对指针或迭代器解引用）。

例如：

{% highlight c++ %}
#include <boost/range/adaptor/indirected.hpp>
#include <boost/range/algorithm/copy.hpp>
#include <boost/shared_ptr.hpp>
#include <algorithm>
#include <iostream>
#include <vector>

int main()
{
	using namespace boost::adaptors;

	std::vector<boost::shared_ptr<int> > input;
	for (int i = 0; i < 10; ++i)
		input.push_back( boost::shared_ptr<int>(new int(i)) );

	boost::copy(
		input | indirected,
		std::ostream_iterator<int>(std::cout, " "));

	return 0;
}
{% endhighlight %}

输出：0 1 2 3 4 5 6 7 8 9

- `map_keys` 

语法：`rng | boost::adaptors::map_keys` 

对于原序列中的每个元素y，返回序列的每个元素x为对应的y.first。因此，原序列可以是关联容器如`map<T, U>`，或者是`pair<T,U>`的序列如`vector< pair<T, U> >`。

- `map_values` 

语法：`rng | boost::adaptors::map_values`

对于原序列中的每个元素y，返回序列的每个元素x为对应的y.second。

- `replaced` 

语法：`rng | boost::adaptors::replaced(new_value, old_value)` 

将原序列中的old_value替换为new_value的序列。

- `replaced_if`

语法：`rng | boost::adaptors::replaced_if(pred, new_value)`

对于原序列的每个元素x，对应的新序列元素满足 `pred(x) ? new_value : x`得到的序列。

- `reversed` 

语法：`rng | boost::adaptors::reversed`

得到一个逆向的range。

- `sliced` 

语法：`rng | boost::adaptors::sliced(n, m)` 与copied同义。

- `strided` 

语法：`rng | boost::adaptors::strided(n)`

以间隔n的方式从第一个元素开始遍历得到的序列。

- `tokenized` （基于正则表达式boost::regex的便利，可惜regex库需要静态编译）

语法：

~~~~
rng | boost::adaptors::tokenized(regex)
rng | boost::adaptors::tokenized(regex, i)
rng | boost::adaptors::tokenized(regex, rndRng)
rng | boost::adaptors::tokenized(regex, i, flags)
rng | boost::adaptors::tokenized(regex, rndRng, flags)
~~~~

例如：

{% highlight c++ %}
#include <boost/range/adaptor/tokenized.hpp>
#include <boost/range/algorithm.hpp>
#include <boost/regex.hpp>

#include <algorithm>
#include <iostream>
#include <vector>
#include <string>
using std::string;
using std::vector;

int main()
{
	// 3个数字加一个单词的格式
	boost::regex reg( "\\d{3}[a-zA-Z]+" );
	string str = "sjw 123sjw 234suninf00";
	vector<string> match_strs;
	boost::copy( str | boost::adaptors::tokenized(reg), std::back_inserter(match_strs) );
	return 0;
}
{% endhighlight %}

- `transformed`

语法：`rng | boost::adaptors::transformed(fun)`

用fun对原序列中的元素进行转化而得到的序列，这个方式大大增加了序列变化的灵活性。

- `uniqued`

语法：`rng | boost::adaptors::uniqued`

保证得到的序列的相邻的元素不等，即对于相邻的`[x,y]`，有`!( x==y )`。


## Range算法

基本上，基于Range的算法是STL算法的基于迭代器对算法的补充，另外，Range算法也新增了一些有用的算法和特征。

关于返回值的说明：

- 部分算法需要指定另外序列的输出迭代器，这种情况一般返回输出序列操作到的迭代器位置。如boost::copy
- 部分算法是整体操作，没有操作的特征迭代器项，这种情况一般返回序列自身。如：boost::sort
- 另外一些算法，对序列操作产生某些特征位置的迭代器，这种情况常常可以配置返回类型，例如：

|---
| 表达式 | 返回值
|-|:-|:-:|-:
| `boost::unique<boost::return_found>(rng)` | 仅返回迭代器，同std::unique
| `boost::unique<boost::return_begin_found>(rng)` | `返回range [boost::begin(rng), found) 默认`
| `boost::unique<boost::return_begin_next>(rng)` | `[boost::begin(rng), boost::next(found))`
| `boost::unique<boost::return_found_end>(rng)` | `[found, boost::end(rng))`
| `boost::unique<boost::return_next_end>(rng)` | `[boost::next(found),boost::end(rng))`
| `boost::unique<boost::return_begin_end>(rng)` | 返回整个range

### 变动性算法

- copy

~~~~
OutputIterator copy(const SinglePassRange& source_rng, OutputIterator out_it);
拷贝序列到输出迭代器，返回值out_it + distance(source_rng)
~~~~

- copy_backward

~~~~
BidirectionalOutputIterator copy_backward(const BidirectionalRange& source_rng,
                      BidirectionalOutputIterator out_it);
将source_rng的元素逆向拷贝到[out_it - distance(source_rng),  out_it)，返回值为
out_it - distance(source_rng)
~~~~

- fill 

~~~~
ForwardRange& fill( ForwardRange& rng, const Value& val );
将序列rng的每个元素设置为val，并返回rgn自身（因为没有需要的输出迭代器）。
~~~~

- fill_n 

~~~~
ForwardRange& fill( ForwardRange& rng, Size n, const Value& val );
设置rng的前n个元素为val，并返回rng自身。
~~~~

- generate 

~~~~
ForwardRange& generate( ForwardRange& rng, Generator gen );
将gen()计算得到的值赋值给rng的每个元素。
~~~~

- inplace_merge 

~~~~
将分段有序的序列，合并为整体有序。
BidirectionalRange&
inplace_merge( BidirectionalRange& rng,
               typename range_iterator<BidirectionalRange>::type middle );

BidirectionalRange&
inplace_merge( BidirectionalRange& rng,
               typename range_iterator<BidirectionalRange>::type middle,
               BinaryPredicate pred );
~~~~

- merge 

~~~~
合并排序。
OutputIterator merge(const SinglePassRange1& rng1,
                     const SinglePassRange2& rng2,
                     OutputIterator          out);

OutputIterator merge(const SinglePassRange1& rng1,
                     const SinglePassRange2& rng2,
                     OutputIterator          out,
                     BinaryPredicate         pred);
~~~~

- nth_element 

~~~~
RandomAccessRange& nth_element(
    RandomAccessRange& rng,
    typename range_iterator<RandomAccessRange>::type nth);

RandomAccessRange& nth_element(
    RandomAccessRange& rng,
    typename range_iterator<RandomAccessRange>::type nth,
    BinaryPredicate sort_pred);
序列rng中的迭代器nth位置的元素就位，之前的元素小于它，之后的大于等于它，但整体无序。
~~~~

- partial_sort 

~~~~
RandomAccessRange& partial_sort(
    RandomAccessRange& rng,
    typename range_iterator<RandomAccessRange>::type middle);

RandomAccessRange& partial_sort(
    RandomAccessRange& rng,
    typename range_iterator<RandomAccessRange>::type middle,
    BinaryPredicate sort_pred);
部分排序，使得[begin(rng),  middle)有序，之后的无序。默认使用operator<()比较。
~~~~

- partition 

~~~~
typename range_iterator<ForwardRange>::type
partition(ForwardRange& rng, UnaryPredicate pred);

template
<
    range_return_value re,
    class ForwardRange,
    class UnaryPredicate
>
typename range_return<ForwardRange, re>::type
partition(ForwardRange& rng, UnaryPredicate pred);
将序列按照谓词pred区分开来，使得前面的元素满足pred(elem)为true，后面的元素则为false。
~~~~

- stable_partition

不改变相同子区间元素顺序。

- remove 

~~~~
typename range_iterator<ForwardRange>::type // 返回迭代器
remove(ForwardRange& rng, const Value& val);

template
<
    range_return_value re,
    class ForwardRange,
    class Value
>
typename range_return<ForwardRange,re>::type // 可以配置返回值
remove(ForwardRange& rng, const Value& val);
移除元素val，产生迭代器new_last，使得[begin(rng), new_last)不再包含val。
~~~~

-  remove_if 

~~~~
与remove相比，多了个谓词，其实不需要_if之类的，因为可以使用range迭代器来替代：
boost::remove( rng | boost::adaptors::filtered(pred) ) 来代替。
~~~~

- remove_copy 

~~~~
OutputIterator
remove_copy(ForwardRange& rng, OutputIterator out, const Value& val);

OutputIterator
remove_copy(const ForwardRange& rng, OutputIterator out, const Value& val);
将除了元素值等于val的元素拷贝到输出迭代器。
~~~~

- remove_copy_if

与remove_copy相比，多了个谓词判断。

- replace 

~~~~
ForwardRange& replace(ForwardRange& rng, const Value& what, const Value& with_what);
替换并返回自身。
~~~~

- replace_copy 
- replace_copy_if 
- replace_if 

拷贝到输出迭代器版本和谓词版本。

- reverse 

~~~~
BidirectionalRange& reverse(BidirectionalRange& rng);
逆向原序列。
~~~~

- reverse_copy 

输出迭代器版本。

- rotate 

~~~~
ForwardRange& rotate(ForwardRange& rng,
                     typename range_iterator<ForwardRange>::type middle);
range的前后两个子区间交换。
~~~~

- rotate_copy 

拷贝输出版本。

- `sort & stable_sort`

~~~~
RandomAccessRange& sort(RandomAccessRange& rng);
RandomAccessRange& sort(RandomAccessRange& rng, BinaryPredicate pred);
排序。
~~~~

- swap_ranges 

~~~~
SinglePassRange2& swap_ranges(SinglePassRange1& rng1, SinglePassRange& rng2);
两个序列对应的元素交换。
~~~~

- transform 

~~~~
OutputIterator transform(const SinglePassRange1& rng,
                         OutputIterator out,
                         UnaryOperation fun);

OutputIterator transform(const SinglePassRange1& rng1,
                         const SinglePassRange2& rng2,
                         OutputIterator out,
                         BinaryOperation fun);
~~~~

- unique 

~~~~
typename range_return<ForwardRange, return_begin_found>::type
unique(ForwardRange& rng);	

typename range_return<ForwardRange, return_begin_found>::type
unique(ForwardRange& rng, BinaryPredicate pred);

template
<
range_return_value re, 
class ForwardRange
>
typename range_return<ForwardRange, re>::type
unique(ForwardRange& rng);

typename range_return<ForwardRange, re>::type
unique(ForwardRange& rng, BinaryPredicate pred);
移除连续的相等“==”元素或者用pred表示的“相等”的元素，得到逻辑新终点new_last，可以通过模板参数range_return_value配置得到需要的序列或者迭代器。
~~~~

- unique_copy 

输出迭代器版本。


### 非变动性算法

- adjacent_find 

~~~~
typename range_iterator<ForwardRange>::type
adjacent_find(ForwardRange& rng);

typename range_iterator<ForwardRange>::type
adjacent_find(ForwardRange& rng, BinaryPred pred);

typename range_return<ForwardRange, re>::type
adjacent_find(ForwardRange& rng);

template
<
    range_return_value re,
    class ForwardRange,
    class BinaryPredicate
>
typename range_return<ForwardRange, re>::type
adjacent_find(ForwardRange& rng, BinaryPredicate pred);
找到第一组(elem,nextElem)，满足elem==nextElem或者binary_pred(elem,nextElem)为true，默认返回指向 elem对应的迭代器found，且可以通过设置模板参数决定返回类型。
~~~~

- binary_search 

~~~~
bool binary_search(const ForwardRange& rng, const Value& val);
bool binary_search(const ForwardRange& rng, const Value& val, BinaryPredicate pred);
二分法查找元素是否存在于rng中。
~~~~

- count 

~~~~
typename range_difference<SinglePassRange>::type
count(SinglePassRange& rng, const Value& val);
返回值等于val的元素的个数。
~~~~

- count_if 

谓词判断的版本。

- equal 

~~~~
bool equal(const SinglePassRange1& rng1,
           const SinglePassRange2& rng2);

bool equal(const SinglePassRange1& rng1,
           const SinglePassRange2& rng2,
           BinaryPredicate         pred);
判断两个序列相等。
~~~~

- lower_bound 

~~~~
typename range_iterator<ForwardRange>::type
lower_bound(ForwardRange& rng, Value val);

template
<
    range_return_value re,
    class ForwardRange,
    class Value
>
typename range_return<ForwardRange, re>::type
lower_bound(ForwardRange& rng, Value val);
默认返回第一个“大于等于value”或者pred(x, value)为false的元素位置。返回类型可以通过re配置。
~~~~

- upper_bound 

返回“第一个大于value”或者pred( val, x )为true的元素位置。可以配置返回值。

- equal_range 

~~~~
std::pair<typename range_iterator<ForwardRange>::type,
          typename range_iterator<ForwardRange>::type>
equal_range(ForwardRange& rng, const Value& val);

std::pair<typename range_iterator<ForwardRange>::type,
          typename range_iterator<ForwardRange>::type>
equal_range(ForwardRange& rng, const Value& val, SortPredicate pred);
返回已序序列的lower_bound与upper_bound得到的迭代器对。
~~~~

- for_each 

~~~~
UnaryFunction for_each(SinglePassRange& rng, UnaryFunction fun);
~~~~

- find 

~~~~
typename range_iterator<SinglePassRange>::type
find(SinglePassRange& rng, Value val);

template
<
    range_return_value re,
    class SinglePassRange,
    class Value
>
typename range_return<SinglePassRange, re>::type
find(SinglePassRange& rng, Value val);
查找第一个元素x，使得满足 x==val，默认返回对应的迭代器，可以通过模板参数指定返回值。
~~~~

- find_first_of 	查找第二序列中等于第一个序列中元素的位置
- find_if 		谓词查找

- find_end 

与下search仅查找第一个子串与最后一个子串的区别。

- search

~~~~
typename range_iterator<ForwardRange1>::type
search(ForwardRange1& rng1, const ForwardRange2& rng2);

typename range_iterator<ForwardRange1>::type,
search(ForwardRange1& rng1, const ForwardRange2& rng2, BinaryPredicate pred);

template
<
    range_return_value re,
    class ForwardRange1,
    class ForwardRange2
>
typename range_return<ForwardRange1, re>::type
search(ForwardRange1& rng1, const ForwardRange2& rng2);

template
<
    range_return_value re,
    class ForwardRange1,
    class ForwardRange2,
    class BinaryPredicate
>
typename range_return<ForwardRange1, re>::type,
search(ForwardRange1& rng1, const ForwardRange2& rng2, BinaryPredicate pred);
查找第一个子串，支持谓词和模板参数指定返回值。
~~~~

- lexicographical_compare 

~~~~
bool lexicographical_compare(const SinglePassRange1& rng1,
                             const SinglePassRange2& rng2);

bool lexicographical_compare(const SinglePassRange1& rng1,
                             const SinglePassRange2& rng2,
                             BinaryPredicate pred);    
默认以字典序operator<比较两个区间或者 使用比较规则comp定义的“小于”比较
~~~~

- max_element 

~~~~
typename range_iterator<ForwardRange>::type
max_element(ForwardRange& rng);

typename range_iterator<ForwardRange>::type
max_element(ForwardRange& rng, BinaryPredicate pred);

template
<
    range_return_value_re,
    class ForwardRange
>
typename range_return<const ForwardRange, re>::type
max_element(const ForwardRange& rng);

template
<
    range_return_value re,
    class ForwardRange,
    class BinaryPredicate
>
typename range_return<ForwardRange, re>::type
max_element(ForwardRange& rng, BinaryPredicate pred);
查找序列中的最大元素。
~~~~

- min_element 

最小元素对应的迭代器。

- mismatch 

~~~~
std::pair<
    typename range_iterator<SinglePassRange1>::type,
    typename range_iterator<const SinglePassRange2>::type >
mismatch(SinglePassRange1& rng1, const SinglePassRange2& rng2);

std::pair<
    typename range_iterator<SinglePassRange1>::type,
    typename range_iterator<const SinglePassRange2>::type >
mismatch(SinglePassRange1& rng1, const SinglePassRange2& rng2,
         BinaryPredicate pred);
第一组两两互异的对应元素 或者 第一组满足pred(elem1,elem2)为false的对应元素。要求distance(rng2) >= distance(rng1)。
~~~~

- search_n 

~~~~
typename range_iterator<ForwardRange>::type
search_n(ForwardRange& rng, Integer n, const Value& value);

typename range_iterator<ForwardRange>::type
search_n(ForwardRange& rng, Integer n, const Value& value,
         BinaryPredicate binary_pred);
查找连续n个元素值等于val 或者 满足binary_pred(x, value)为true的位置。
~~~~

### 已序序列集合算法

- includes 

~~~~
bool includes(const SinglePassRange1& rng1, const SinglePassRange2& rng2);

bool includes(const SinglePassRange1& rng1, const SinglePassRange2& rng2,
              BinaryPredicate pred);   
rng2中的元素在rng1中都出现，则返回true。默认使用operator<()，即：
!( x < y ) && !(y < x)就表示等同；在谓词版本!pred(x, y) && !pred(y, x)
~~~~

- set_union 				：并集
- set_intersection 			：交集
- set_difference 
- set_symmetric_difference 


### 堆算法

- push_heap 
- pop_heap 
- make_heap 
- sort_heap 


### 排列算法

- next_permutation 
- prev_permutation 


### 数值算法

- accumulate 

~~~~
Value accumulate(const SinglePassRange& source_rng,
                 Value init);

Value accumulate(const SinglePassRange& source_rng,
                 Value init,
                 BinaryOperation op);
Init作为初始状态，op作为变化函数的序列状态积累。即折叠fold。
~~~~

- inner_product ：内积值，两个序列的操作状态累积。

- adjacent_difference 

~~~~
OutputIterator adjacent_difference(
    const SinglePassRange& source_rng,
    OutputIterator out_it);

OutputIterator adjacent_difference(
    const SinglePassRange& source_rng,
    OutputIterator out_it,
    BinaryOperation op);
相邻元素的变化值序列。
~~~~

- partial_sum ：累加和序列


### 相比STL新增的一些算法（algorithm_ext）

- copy_n 

~~~~
OutputIterator copy_n(const SinglePassRange& rng, Size n, OutputIterator out);
~~~~

- erase 

~~~~
template<class Container>
Container& erase(
    Container& target,
    iterator_range<typename Container::iterator> to_erase);
调用容器的erase方法，删除容器中指定的range区间。
~~~~

例如：

{% highlight c++ %}
#include <boost/range/algorithm.hpp>
#include <boost/range/algorithm_ext/erase.hpp>
#include <algorithm>
#include <iostream>
#include <vector>

int main()
{
	int input[] = { 1,3,5,7,9,2,4,6,8, 2,2,3,3,4,4 };
	std::vector<int> vec;
	boost::copy( input, std::back_inserter(vec) );

	// 排序并删除重复元素
	boost::erase(vec, boost::unique<boost::return_found_end>( boost::sort(vec) ));
	
	boost::copy( vec, std::ostream_iterator<int>(std::cout, " ") );

	return 0;
}
{% endhighlight %}

输出：1 2 3 4 5 6 7 8 9

- for_each 

~~~~
BinaryFunction for_each(const SinglePassRange1& rng1,
                        const SinglePassRange2& rng2,
                        BinaryFunction fn);
两个range的对应元素，依次应用于二元函数fn，到达短的range末尾即停止。
~~~~

- insert 

~~~~
Container& insert(Container& target,
                  typename Container::iterator before,
                  const SinglePassRange& from);
在容器target的迭代器before之前插入range。
~~~~

- iota 

~~~~
ForwardRange& iota(ForwardRange& rng, Value x);
rng的每个元素设置为 x + boost::distance(boost::begin(rng), it)
~~~~

- is_sorted 

~~~~
bool is_sorted(const SinglePassRange& rng);
bool is_sorted(const SinglePassRange& rng, BinaryPredicate pred);
序列是否已序，默认相邻元素x，y满足：x < y，带谓词版本为pred(x,y)为true
~~~~

- overwrite 

~~~~
void overwrite(const SinglePassRange1& from,
               SinglePassRange2& to);
将from的内容写到序列to中，要求from长度小于to。
~~~~

- push_back 

~~~~
Container& push_back(Container& target,
                     const SinglePassRange& from);
将range的元素插入到target后面。
~~~~

- push_front 

~~~~
Container& push_front(Container& target,
                      const SinglePassRange& from);
将range插入到容器的前面。
~~~~

- remove_erase 

~~~~
Container& remove_erase(Container& target,
                        const Value& value);
与remove算法来比较，remove_erase真正的删除等于value的元素
~~~~

- remove_erase_if 

~~~~
Container& remove_erase_if(Container& target,
                           Pred pred);
真正删除满足条件的元素。
~~~~


## 工具类和函数

### iterator_range

封装了两个迭代器，构造了前向Renge的概念。

声明：

{% highlight c++ %}
template< class ForwardTraversalIterator >
class iterator_range
{
public: // Forward Range types
	typedef ForwardTraversalIterator   iterator;
	typedef ForwardTraversalIterator   const_iterator;
	typedef iterator_difference<iterator>::type difference_type;

public: // construction, assignment
	template< class ForwardTraversalIterator2 >
	iterator_range( ForwardTraversalIterator2 Begin, ForwardTraversalIterator2 End );

	template< class ForwardRange >
	iterator_range( ForwardRange& r );

	template< class ForwardRange >
	iterator_range( const ForwardRange& r );

	template< class ForwardRange >
	iterator_range& operator=( ForwardRange& r );

	template< class ForwardRange >
	iterator_range& operator=( const ForwardRange& r );

public: // Forward Range functions
	iterator  begin() const;
	iterator  end() const;

public: // convenience
	operator    unspecified_bool_type() const; 
	bool        equal( const iterator_range& ) const;

	value_type& front() const;
	value_type& back() const;
	iterator_range& advance_begin(difference_type n);
	iterator_range& advance_end(difference_type n);
	bool      empty() const;

	// for Random Access Range only: 
	reference operator[]( difference_type at ) const;
	value_type operator()( difference_type at ) const;
	size_type size() const;
};
{% endhighlight %}


非成员函数：

- 支持`operator<<、==、!=、<`等

- make_iterator_range函数，辅助生成iterator_range对象

{% highlight c++ %}
template< class ForwardTraversalIterator >
iterator_range< ForwardTraversalIterator >
make_iterator_range( ForwardTraversalIterator Begin, 
					ForwardTraversalIterator End );

template< class ForwardRange >
iterator_range< typename range_iterator<ForwardRange>::type >
make_iterator_range( ForwardRange& r );

template< class ForwardRange >
iterator_range< typename range_iterator<const ForwardRange>::type >
make_iterator_range( const ForwardRange& r );

template< class Range >
iterator_range< typename range_iterator<Range>::type >
make_iterator_range( Range& r,
				typename range_difference<Range>::type advance_begin,
					typename range_difference<Range>::type advance_end );

template< class Range >
iterator_range< typename range_iterator<const Range>::type >
make_iterator_range( const Range& r, 
			typename range_difference<const Range>::type advance_begin,
			typename range_difference<const Range>::type advance_end );
{% endhighlight %}

- 从Range拷贝返回一个容器

~~~~
template< class Sequence, class ForwardRange >
Sequence copy_range( const ForwardRange& r );
~~~~

### sub_range

~~~~
template< class ForwardRange >
class sub_range : 
	public iterator_range< typename range_iterator<ForwardRange>::type >
{
	//...
};
~~~~

sub_range的模板参数为Range，直接继承自iterator_range，只不过迭代器模板参数是计算出来。

例如：

~~~~
std::string str("hello");
iterator_range<std::string::iterator> ir = find_first( str, "ll" );
sub_range<std::string>               sub = find_first( str, "ll" );
~~~~

### join

~~~~
template<typename SinglePassRange1, typename SinglePassRange2>
iterator_range<...>
join(const SinglePassRange1& rng1, const SinglePassRange2& rng2)

template<typename SinglePassRange1, typename SinglePassRange2>
iterator_range<...>
join(SinglePassRange1& rng1, SinglePassRange2& rng2);
将两个range连接起来。
~~~~

## Range库扩展

1、	使自己的序列满足range概念的序列：

- begin()、end() 回对应的首尾迭代器
- 内嵌iterator、const_iterator来指定迭代器类型

2、使用配接器由于可以多次operator|折叠，这样使得range的配接可以非常的灵活

比如：取出奇数并平方输出

{% highlight c++ %}
#include <boost/range/algorithm.hpp>
#include <boost/range/adaptor/filtered.hpp>
#include <boost/range/adaptor/transformed.hpp>

#include <vector> 
#include <iostream>

int main()
{
	int input[] = {1,2,3,4,5,6,7};

	struct is_odd
	{
		bool operator() (int n) const {return n%2==1; }
	};

	struct square 
	{
		typedef int result_type; // 标准仿函数返回类型声明
		int operator() (int n) const {return n*n;}
	};

	boost::copy( input | boost::adaptors::filtered( is_odd() )
		                  | boost::adaptors::transformed( square() ), 
		           std::ostream_iterator<int>(std::cout, " ") );

	return 0;
}
{% endhighlight %}

输出：1 9 25 49

总之，灵活的使用range配接器和算法，让代码更加直接清晰，富有表达力。

3、Range配接器的实现

一般来说，已有的配接器已经具有很大的灵活性，一般不需要直接进行adaptor底层扩展，如果需要的话，也是有套路的。

(1)、实现无参数配接器 如：reversed

{% highlight c++ %}
namespace boost
{
    namespace range_detail
    {
        template< class R >
        struct reverse_range : // 实现了Range概念的逆向range类型
            public boost::iterator_range< 
                      boost::reverse_iterator<
                        typename range_iterator<R>::type >
                                         >
        {
        private:
            typedef boost::iterator_range< 
                      boost::reverse_iterator<
                        typename range_iterator<R>::type >
                                         >   base;
            
        public:
            typedef boost::reverse_iterator<typename range_iterator<R>::type> iterator;

            reverse_range( R& r ) 
                : base( iterator(boost::end(r)), iterator(boost::begin(r)) )
            { }
        };

        struct reverse_forwarder {};	// Adaptor的标识，用于operator|()
        
		// 灵活的operator|()操作，返回reverse_range对象
        template< class BidirectionalRng >
        inline reverse_range<BidirectionalRng> 
        operator|( BidirectionalRng& r, reverse_forwarder )
        {
            return reverse_range<BidirectionalRng>( r );   
        }
    
        template< class BidirectionalRng >
        inline reverse_range<const BidirectionalRng> 
        operator|( const BidirectionalRng& r, reverse_forwarder )
        {
            return reverse_range<const BidirectionalRng>( r );   
        }
        
    } // 'range_detail'
    
    using range_detail::reverse_range;

    namespace adaptors
    { 
        namespace
        {
			// 写一个标识对象，用于operator|()的右参数
            const range_detail::reverse_forwarder reversed = 
                                            range_detail::reverse_forwarder();
        }
        
		// 支持函数调用来返回reverse_range的版本，但是不实用
        template<class BidirectionalRange>
        inline reverse_range<BidirectionalRange>
        reverse(BidirectionalRange& rng)
        {
            return reverse_range<BidirectionalRange>(rng);
        }
        
        template<class BidirectionalRange>
        inline reverse_range<const BidirectionalRange>
        reverse(const BidirectionalRange& rng)
        {
            return reverse_range<const BidirectionalRange>(rng);
        }
    } // 'adaptors'
    
} // 'boost'
{% endhighlight %}

(2)、实现带参数的配接器如 replaced

{% highlight c++ %}
namespace boost
{
    namespace range_detail
    {
		// 实际配接运算的仿函数
        template< class Value >
        class replace_value
        {
        public:
            typedef const Value& result_type;
            typedef const Value& first_argument_type;

            replace_value(const Value& from, const Value& to)
                :   m_from(from), m_to(to)
            {
            }

            const Value& operator()(const Value& x) const
            {
                return (x == m_from) ? m_to : x;
            }

        private:
            Value m_from;
            Value m_to;
        };

        template< class R >
        class replaced_range : // 配接返回的Range类型
            public boost::iterator_range<
                boost::transform_iterator< // 使用boost.iterator库
                    replace_value< typename range_value<R>::type >,
                    typename range_iterator<R>::type > >
        {
        private:
            typedef replace_value< typename range_value<R>::type > Fn; // 操作

            typedef boost::iterator_range<
                boost::transform_iterator<
                    replace_value< typename range_value<R>::type >,
                    typename range_iterator<R>::type > > base_t;

        public:
            typedef typename range_value<R>::type value_type;

            replaced_range( R& r, value_type from, value_type to )
                : base_t( make_transform_iterator( boost::begin(r), Fn(from, to) ),
                          make_transform_iterator( boost::end(r), Fn(from, to) ) )
            { }
        };

		// Adaptor的标识类，带参数的需要写上holder
        template< class T >
        class replace_holder : public holder2<T>
        {
        public:
            replace_holder( const T& from, const T& to )
                : holder2<T>(from, to)
            { }
        private:
            // not assignable
            void operator=(const replace_holder&);
        };

        template< class InputRng >
        inline replaced_range<InputRng>
        operator|( InputRng& r,
                   const replace_holder<typename range_value<InputRng>::type>& f )
        {
            return replaced_range<InputRng>(r, f.val1, f.val2);
        }

        template< class InputRng >
        inline replaced_range<const InputRng>
        operator|( const InputRng& r,
                   const replace_holder<typename range_value<InputRng>::type>& f )
        {
            return replaced_range<const InputRng>(r, f.val1, f.val2);
        }
    } // 'range_detail'

    using range_detail::replaced_range;

    namespace adaptors
    {
        namespace
        {
            const range_detail::forwarder2<range_detail::replace_holder>
                replaced =
                    range_detail::forwarder2<range_detail::replace_holder>();
        }

        template<class InputRange>
        inline replaced_range<InputRange>
        replace(InputRange& rng,
                typename range_value<InputRange>::type from,
                typename range_value<InputRange>::type to)
        {
            return replaced_range<InputRange>(rng, from, to);
        }

        template<class InputRange>
        inline replaced_range<const InputRange>
        replace(const InputRange& rng,
                typename range_value<const InputRange>::type from,
                typename range_value<const InputRange>::type to)
        {
            return replaced_range<const InputRange>(rng, from ,to);
        }

    } // 'adaptors'
} // 'boost'
{% endhighlight %}
