---
layout: article
title: STL算法注解
category: c++
---

关于STL算法的说明：

1. 注意算法的返回值，特别是查找，删除，拷贝的函数通过返回值的形式来表达效果。
2. 由于算法都是模板函数，所以传递的函数可以是普通函数(指针)或者函数对象，有了Lambda函数，STL算法如虎添翼。
3. 注意使用特定算法的合适情况，熟练使用常用的算法。

## 容器自带的算法性成员函数说明：

- vector/deque/string适合于STL算法

- list

~~~~
remove( const T& t )
unique()
merge( list& l )
sort()
~~~~

- `set/multiset/map/multimap` 

~~~~
find( const key_type& k )
count( const key_type& k )
lower_bound( const key_type& k )
upper_bound( const key_type& k )
equal_range( const key_type& k )
~~~~

- priority_queue实现了优先队列的算法（内部使用了堆排序算法）

- stack/queue分别适用于栈和队列的基本数据结构。
 

## 关于标准库仿函数配接器（本身是模板函数）的说明

### `bind1st, bind2nd, not1, not2` 

它们接受从unary_function和binary_function继承的函数对象，因为这几个配接器使用函数对象类的一些typedef，即：return_type和argument_type,first_argument_type, second_argument_type等。

- 配接器返回的函数对象可以继续被配接。
- bind1st, bind2nd分别用于绑定函数对象的第1或第2个参数；
- 而not1,not2对函数对象效果取反，后面的数字1，2代表参数的数目。

效果：

~~~~
bind1st( func, val ) -> func( val, param )
bind2nd( func, val ) -> func( param, val )
not1( func ) -> ! func( param )
not2(func) -> ! func( param1, param2 )
~~~~

### `mem_fun_ref, mem_fun`

- 成员函数配接器mem_fun_ref, mem_fun分别针对函数对象本身以及其指针。
- op是类的成员函数地址, 如`&X::func`，可以是一个参数或者无参数的成员函数。（目前只支持如此，要实现多个参数，标准库需要扩展，因为单参数的成员函数实际上已经是binary_function继承的了）。

`mem_fun_ref( op )`
: 返回函数对象，本身可以作为STL算法的参数，如果是单个参数的成员函数，用于算法还需要配接。它以类的对象obj为第一个参数（可能存在第二个参数），因此情况是：`mem_fun_ref(op)( obj )` 或者 `mem_fun_ref(op)(obj, param)`

`men_fun(op)`
: 与mem_fun_ref类似，不过mem_fun(op)能接受的第一个参数是对象指针objPtr，也有单参数和无参数两种情况。mem_fun(op)( objPtr ) 或者 mem_fun(op)( objPtr, param )。返回的单参数函数对象需要配接。

### `ptrfun`

ptrfun是一般函数的配接器，两种形式（分别对应unary_function和binary_function），`ptr_fun( func )` -> `func( param ) 或者 func( param1,param2 )`，返回的函数对象可以被配接，至于是单参数还是两个参数，你自己是知道的，而不用管是怎么实现的，内部有很多重载，有兴趣看源码。

注意：所有配接器返回可配接的函数对象，可带1或2个参数，从unary_function或binary_function继承的；目前的boost的bind和function库功能更好更清晰；Lambda函数将使配接器更加受挫^_^


## `#include <numeric>`中的数值算法：

`accumulate, inner_product, adjacent_difference, partial_sum`
 
### accumulate

{% highlight c++ %}
T accumulate(InputIterator first, InputIterator last, T init)
T accumulate(InputIterator first, InputIterator last, T init,
             BinaryOperation binary_op)
{% endhighlight %}

1. 从给定初值开始，累“加”返回计算得到的T类型值。
2. 实际的迭代计算式分别是：`init = init + elem;` 和 `init = binary_op(init, elem);`
3. 对于`a1,a2,a3,a4...` 上述两个算法的计算过程：

~~~~
init + a1 + a2 + a3 + ...
init op a1 op a2 op a3 ...
~~~~
 
### inner_product

{% highlight c++ %}
T inner_product(InputIterator1 first1, InputIterator1 last1,
                InputIterator2 first2, T init)
T inner_product(InputIterator1 first1, InputIterator1 last1,
                InputIterator2 first2, T init, BinaryOperation1 binary_op1,
                BinaryOperation2 binary_op2)
{% endhighlight %}

1. 中间过程的计算表达式：`init = init + elem1*elem2;` 和 `init = op1( init, op2( elem1, elem2 ) );`
2. 按照第一区间循环，须要保证第二区间长度足够长。
3. 对于两序列：`a1,a2,a3... 和 b1,b2,b3...` ，计算结果表达为：

~~~~
init + a1*b1 + a2*b2 + ...
init op1 ( a1 op2 b2 ) op1 ( a2 op2 b2 ) op1 ...
~~~~

### adjacent_difference

{% highlight c++ %}
OutputIterator adjacent_difference(InputIterator first, InputIterator last,
                                   OutputIterator result)
OutputIterator adjacent_difference(InputIterator first, InputIterator last,
                                   OutputIterator result,
                                   BinaryOperation binary_op)
{% endhighlight %}

1. 将第一区间的值之间的相对值写入result开始的第二区间，返回OutputIterator的“最后一个写入值的下一个位置”，或者说第一个没被覆盖的位置的迭代器。
2. 于序列：`a1,a2,a3,a4...`，计算结果（写入到输出区间）为序列：`a1, a2-a1, a3-a2, a4-a3... 和 a1, a2 op a1, a3 op a2, a4 op a3...`
 
### partial_sum

{% highlight c++ %}
OutputIterator partial_sum(InputIterator first, InputIterator last,
                           OutputIterator result)
OutputIterator partial_sum(InputIterator first, InputIterator last,
                           OutputIterator result, BinaryOperation binary_op)
{% endhighlight %}

1. 是adjacent_different的逆过程，计算结果写入输出区间，返回最后一个被写入的下一位置。
2. 对于`a1,a2,a3...`，计算过程：`a1, a1+a2, a1+a2+a3 ...和 a1, a1 op a2, a1 op a2 op a3...`
 
 
## `#include <algorithm>`中大致的分类：

### 非变动性算法：

`for_each, count, count_if, min_element, max_element, find, find_if, search_n, search, find_end, find_first_of, adjacent_find, equal, mismatch, lexicographical_compare`
 
- for_each

{% highlight c++ %}
Function for_each(InputIterator first, InputIterator last, Function f) {
  for ( ; first != last; ++first)
    f(*first);
  return f;
}
{% endhighlight %}

1. 对区间的每个值调用函数，如果是引用传递，可以改变区间中变量的状态。
2. 注意返回是Function类型值，如果是函数对象，可以带状态返回（特殊需要时使用）。
 
- `count, count_if`

{% highlight c++ %}
typename iterator_traits<InputIterator>::difference_type
    count(InputIterator first, InputIterator last, const T& value)
typename iterator_traits<InputIterator>::difference_type
    count_if(InputIterator first, InputIterator last, Predicate pred)
{% endhighlight %}

1. 返回区间内查找出的值等于value或者op(elem)为true的元素数量。
2. 关联容器set,multiset,map,multimap等请使用count成员函数（基于内部结构的树的搜索）。
 
- `min_element, max_element`

{% highlight c++ %}
ForwardIterator min_element(ForwardIterator first, ForwardIterator last)
ForwardIterator min_element(ForwardIterator first, ForwardIterator last,
                            Compare comp)
ForwardIterator max_element(ForwardIterator first, ForwardIterator last)
ForwardIterator max_element(ForwardIterator first, ForwardIterator last,
                            Compare comp)
{% endhighlight %}

1. 返回区间的最小 或 最大 的元素对应的迭代器。
2. 默认以 `operator <` 为判断规则; 提供comp时：如果elem1“小于”elem2，comp(elem1,elem2)为true
 
- `find, find_if`

{% highlight c++ %}
InputIterator find(InputIterator first, InputIterator last, const T& value)
InputIterator find_if(InputIterator first, InputIterator last,
                      Predicate pred)
{% endhighlight %}

1. 线性时间查找第一个值为value或pred(elem)为true的元素的迭代器，适合未排序序列，查找不到返回last。
2. 对于已序区间，可以使用lower_bound,upper_bound,equal_range等算法二分搜索。
3. 对于关联容器，直接使用成员函数find。
 
- search_n

{% highlight c++ %}
ForwardIterator search_n(ForwardIterator first, ForwardIterator last,
                         Integer count, const T& value)
ForwardIterator search_n(ForwardIterator first, ForwardIterator last,
                         Integer count, const T& value,
                         BinaryPredicate binary_pred)
{% endhighlight %}

1. 查找连续count个元素满足：值均为value或值均满足`binary_pred( elem,value )`均为true的元素组的第一个元素位置。
2. 这里的二元谓词用的比较孤僻，标准库的其他算法使用到二元谓词的都是两个区间的。
 
- search，find_end  查找成功，返回找到子区间的首元素，查找失败返回last1

{% highlight c++ %}
// [first1,last1)中查找第一个子区间，它与[first2,last2)完全对应
ForwardIterator1 search(ForwardIterator1 first1, ForwardIterator1 last1,
                               ForwardIterator2 first2, ForwardIterator2 last2)
    
// [first1,last1)中查找第一个子区间，使得所有对应的binary_pred(elem1,elem2)均为true
ForwardIterator1 search(ForwardIterator1 first1, ForwardIterator1 last1,
                               ForwardIterator2 first2, ForwardIterator2 last2,
                               BinaryPredicate binary_pred)
    
ForwardIterator1 find_end(ForwardIterator1 first1, ForwardIterator1 last1,
         ForwardIterator2 first2, ForwardIterator2 last2)
ForwardIterator1 find_end(ForwardIterator1 first1, ForwardIterator1 last1,
         ForwardIterator2 first2, ForwardIterator2 last2,
         BinaryPredicate comp)
{% endhighlight %}

find_end 与search恰好完全相反，找出最后一个子序列与[first2,last2)匹配
 
- find_first_of

{% highlight c++ %}
// 找出[first1,last1)中的第一个也存在于[first2,last2)中的元素
InputIterator find_first_of(InputIterator first1, InputIterator last1,
                            ForwardIterator first2, ForwardIterator last2)

// 找出[first1,last1)中的第一个元素elem1，它满足：与 [first2,last2)中的所有元素作用，都满足comp( elem1,elem2 )为true。
InputIterator find_first_of(InputIterator first1, InputIterator last1,
                            ForwardIterator first2, ForwardIterator last2,
                            BinaryPredicate comp)
{% endhighlight %}
 
- adjacent_find

{% highlight c++ %}
// 返回连续两个相等元素的第一个元素的迭代器
ForwardIterator adjacent_find(ForwardIterator first, ForwardIterator last)
    
// 找到第一组(elem,nextElem)，满足binary_pred(elem,nextElem)为true，返回elem对应的迭代器
ForwardIterator adjacent_find(ForwardIterator first, ForwardIterator last,
                              BinaryPredicate binary_pred)
{% endhighlight %}
 
- equal

{% highlight c++ %}
bool equal(InputIterator1 first1, InputIterator1 last1,
           InputIterator2 first2);
bool equal(InputIterator1 first1, InputIterator1 last1,
           InputIterator2 first2, BinaryPredicate binary_pred);
{% endhighlight %}

两个序列所有元素对应相等或者都满足binary_pred(elem1,elem2)为true时，返回true
 
- mismatch

{% highlight c++ %}
pair<InputIterator1, InputIterator2>
    mismatch(InputIterator1 first1, InputIterator1 last1, InputIterator2 first2);
pair<InputIterator1, InputIterator2>
    mismatch(InputIterator1 first1, InputIterator1 last1, InputIterator2 first2,
         BinaryPredicate binary_pred);
{% endhighlight %}

1. 返回[first1,last1)与“first2开始的区间”的第一组两两互异的对应元素，或者 第一组满足binary_pred(elem1,elem2)为false的对应元素
2. 如果失配，则返回pair，包含last1和第二区间的对应元素
 
- lexicographical_compare

{% highlight c++ %}
bool lexicographical_compare(InputIterator1 first1, InputIterator1 last1,
                             InputIterator2 first2, InputIterator2 last2);
bool lexicographical_compare(InputIterator1 first1, InputIterator1 last1,
                             InputIterator2 first2, InputIterator2 last2,
                             BinaryPredicate comp);
{% endhighlight %}

默认以字典序`operator<`比较两个区间或者 使用比较规则comp定义的“小于”比较
 
### 变动性算法

`copy, copy_backward, transform, swap_ranges, fill, fill_n, generate, generate_n, replace, replace_if, replace_copy, replace_copy_if`
 
- copy, copy_backward

{% highlight c++ %}
OutputIterator copy(InputIterator first, InputIterator last,
                    OutputIterator result);
BidirectionalIterator2 copy_backward(BidirectionalIterator1 first,
                                     BidirectionalIterator1 last,
                                     BidirectionalIterator2 result);
{% endhighlight %}

1. 拷贝[first,last）中的元素到以result为起点或者终点的序列中，返回目标区间的最后一个被复制元素的下一个位置（即未覆盖的第一个位置）
2. 注意目标序列的容量，注意如果是同一个容器的情况。
 
- transform

{% highlight c++ %}
OutputIterator transform(InputIterator first, InputIterator last,
                         OutputIterator result, UnaryOperation op)
OutputIterator transform(InputIterator1 first1, InputIterator1 last1,
                         InputIterator2 first2, OutputIterator result,
                         BinaryOperation binary_op)
{% endhighlight %}

函数结果写到目标迭代器：`op( elem ) -> result 或者 binary_op( elem1, elem2 ) -> result`
 
- swap_ranges  序列对应元素交换

{% highlight c++ %}
ForwardIterator2 swap_ranges(ForwardIterator1 first1, ForwardIterator1 last1,
                             ForwardIterator2 first2)
{% endhighlight %}

- fill, fill_n  序列填充

{% highlight c++ %}
void fill(ForwardIterator first, ForwardIterator last, const T& value);
OutputIterator fill_n(OutputIterator first, Size n, const T& value);
{% endhighlight %}

- generate, generate_n

{% highlight c++ %}
void generate(ForwardIterator first, ForwardIterator last, Generator gen) {
  for ( ; first != last; ++first)
    *first = gen();
}
 
OutputIterator generate_n(OutputIterator first, Size n, Generator gen) {
  for ( ; n > 0; --n, ++first)
    *first = gen();
  return first;
}
{% endhighlight %}

- replace, replace_if

{% highlight c++ %}
void replace(ForwardIterator first, ForwardIterator last, const T& old_value,
             const T& new_value) //每一个与old_value相等的值都替换为new_value
void replace_if(ForwardIterator first, ForwardIterator last, Predicate pred,
                const T& new_value) //每个满足pred(elem)为true的值替换为new_value
{% endhighlight %}
 
- replace_copy, replace_copy_if 

{% highlight c++ %}
//不在原序列上改，而是拷贝到result开始的迭代器上
OutputIterator replace_copy(InputIterator first, InputIterator last,
                            OutputIterator result, const T& old_value,
                            const T& new_value)
OutputIterator replace_copy_if(Iterator first, Iterator last,
                               OutputIterator result, Predicate pred,
                               const T& new_value)
{% endhighlight %}

## 移除性算法

`remove, remove_if, remove_copy, remove_copy_if, unique, unique_copy`

不是真正的删除，而是覆盖掉无效的元素，因此序列尾部会产生冗余，需要注意返回值对应位置

- remove, remove_if

{% highlight c++ %}
ForwardIterator remove(ForwardIterator first, ForwardIterator last,
                       const T& value)
ForwardIterator remove_if(ForwardIterator first, ForwardIterator last,
                          Predicate pred)
{% endhighlight %}

移除值等于“==”value或者满足pred(elem)为true的元素，返回变动后的新逻辑终点。
 
- remove_copy, remove_copy_if

{% highlight c++ %}
OutputIterator remove_copy(InputIterator first, InputIterator last,
                           OutputIterator result, const T& value)
OutputIterator remove_copy_if(InputIterator first, InputIterator last,
                              OutputIterator result, Predicate pred)
{% endhighlight %}

1. 不在原序列操作，而是把[first，last)中的元素拷贝到result对应的输出序列中，值为value或者pred(elem)为true的值不拷贝（因为是要移除的）。
2. 返回result开始的输出序列的最后一个写入元素的下一个位置。

- unique, unique_copy

{% highlight c++ %}
// 移除连续的相等“==”元素 或者用binary_pred表示的“相等”的元素，返回逻辑新终点。
ForwardIterator unique(ForwardIterator first, ForwardIterator last)
ForwardIterator unique(ForwardIterator first, ForwardIterator last,
                       BinaryPredicate binary_pred)

// 原区间不变，结果拷贝出来，返回输出迭代器的最后一个拷贝元素的下一个位置。
OutputIterator unique_copy(InputIterator first, InputIterator last,
                                  OutputIterator result)
OutputIterator unique_copy(InputIterator first, InputIterator last,
                                  OutputIterator result,
                                  BinaryPredicate binary_pred)
{% endhighlight %}
 
## 变序性算法

`reverse, reverse_copy, rotate, rotate_copy, next_permutation, prev_permutation, partition, stable_partition`
 
- reverse, reverse_copy 使逆序

{% highlight c++ %}
void reverse(BidirectionalIterator first, BidirectionalIterator last)
OutputIterator reverse_copy(BidirectionalIterator first,
                            BidirectionalIterator last,
                            OutputIterator result)
{% endhighlight %}

- rotate, rotate_copy

{% highlight c++ %}
void rotate(ForwardIterator first, ForwardIterator middle,
                   ForwardIterator last)
OutputIterator rotate_copy(ForwardIterator first, ForwardIterator middle,
                           ForwardIterator last, OutputIterator result)
{% endhighlight %}
 
- next_permutation, prev_permutation

{% highlight c++ %}
bool next_permutation(BidirectionalIterator first, BidirectionalIterator last)
bool next_permutation(BidirectionalIterator first, BidirectionalIterator last,
                      Compare comp)
bool prev_permutation(BidirectionalIterator first, BidirectionalIterator last)
bool prev_permutation(BidirectionalIterator first, BidirectionalIterator last,
                      Compare comp)
{% endhighlight %}

1. 字典序的遍历排列
2. 如果返回值为true说明还存在对应的排列
 
- partition, stable_partition

{% highlight c++ %}
BidirectionalIterator partition(BidirectionalIterator first,
                                BidirectionalIterator last, Predicate pred)
ForwardIterator stable_partition(ForwardIterator first, ForwardIterator last,
                                        Predicate pred)
{% endhighlight %}

1. 将pred(elem)为true的元素前移，最终状态是前面的元素满足pred(elem)为true，后面的元素则为false
2. 对于stable_partition还保证pred(elem)同为true或者同为false的元素的相对位置。
3. 返回值是分割点：pred(elem)为false的第一个元素位置
 
## 排序算法(可以给定比较规则)

`sort, stable_sort, partial_sort, partial_sort_copy, nth_element, (make_heap, push_heap, pop_heap,  sort_heap)`
 
- sort, stable_sort 要求随机访问迭代器

{% highlight c++ %}
void sort(RandomAccessIterator first, RandomAccessIterator last)
void sort(RandomAccessIterator first, RandomAccessIterator last, Compare comp)
void stable_sort(RandomAccessIterator first, RandomAccessIterator last)
void stable_sort(RandomAccessIter first, RandomAccessIter last, Compare comp)
{% endhighlight %}

- partial_sort, partial_sort_copy

{% highlight c++ %}
void partial_sort(RandomAccessIterator first, RandomAccessIterator middle,
                  RandomAccessIterator last);
void partial_sort(RandomAccessIterator first, RandomAccessIterator middle,
                  RandomAccessIterator last, StrictWeakOrdering comp);
RandomAccessIterator partial_sort_copy(InputIterator first, InputIterator last,      
                    RandomAccessIterator result_first, RandomAccessIterator result_last);
RandomAccessIter partial_sort_copy(InputIterator first, InputIterator last,
      RandomAccessIter result_first, RandomAccessIter result_last, Compare comp);
{% endhighlight %}

1. 使[first,middle)位置区间的元素处于有序，默认使用operator<作为比较规则或者comp指定
2. Partial_sort_copy将排好序放到result对应的区间，排序的数目为[first,last)和[result_first,result_last)元素数量的较小值。
 
- nth_element

{% highlight c++ %}
void nth_element(RandomAccessIterator first, RandomAccessIterator nth,
                 RandomAccessIterator last);
void nth_element(RandomAccessIterator first, RandomAccessIterator nth,
                 RandomAccessIterator last, StrictWeakOrdering comp);
{% endhighlight %}

迭代器nth位置的元素就位，之前的元素小于它，之后的大于等于它，但整体无序。
 
- make_heap,  push_heap,  pop_heap,  sort_heap

说明：一般不需要这几个函数，因为已经有priority_queue封装了这些的使用
 
### 已序区间算法

`binary_search, includes, lower_bound, upper_bound, equal_range, merge, set_union, set_intersection, set_difference, set_symmetric_difference, inplace_merge`
 
- binary_search 是否存在

{% highlight c++ %}
bool binary_search(ForwardIterator first, ForwardIterator last,
                   const LessThanComparable& value);
bool binary_search(ForwardIterator first, ForwardIterator last, const T& value,
                   StrictWeakOrdering comp);
{% endhighlight %}

- includes 根据已序，判断是否包含

{% highlight c++ %}
bool includes(InputIterator1 first1, InputIterator1 last1,
              InputIterator2 first2, InputIterator2 last2);
bool includes(InputIterator1 first1, InputIterator1 last1,
              InputIterator2 first2, InputIterator2 last2,
              StrictWeakOrdering comp);
{% endhighlight %}

- lower_bound, upper_bound, equal_range

{% highlight c++ %}
ForwardIterator lower_bound(ForwardIterator first, ForwardIterator last,
                            const LessThanComparable& value);
ForwardIterator lower_bound(ForwardIterator first, ForwardIterator last,
                            const T& value, StrictWeakOrdering comp);
ForwardIterator upper_bound(ForwardIterator first, ForwardIterator last,
                            const LessThanComparable& value);
ForwardIterator upper_bound(ForwardIterator first, ForwardIterator last,
                            const T& value, StrictWeakOrdering comp);
pair<ForwardIterator, ForwardIterator>
    equal_range(ForwardIterator first, ForwardIterator last,
            const LessThanComparable& value);
pair<ForwardIterator, ForwardIterator>
    equal_range(ForwardIterator first, ForwardIterator last, const T& value,
            StrictWeakOrdering comp);
{% endhighlight %}

1. lower_bound：返回“第一个大于等于value”的元素位置。
2. upper_bound：返回“第一个大于value”的元素位置。
3. equal_range：返回lower_bound和upper_bound对应迭代器的pair
 
- merge

{% highlight c++ %}
OutputIterator merge(InputIterator1 first1, InputIterator1 last1,
                     InputIterator2 first2, InputIterator2 last2,
                     OutputIterator result);
OutputIterator merge(InputIterator1 first1, InputIterator1 last1,
                     InputIterator2 first2, InputIterator2 last2,
                     OutputIterator result, StrictWeakOrdering comp);
{% endhighlight %}

1. 两个已序区间合并成有序的大区间，输出到result，默认以`operator<`规则
2. 如果原小区间以comp为排序规则，则merge要提供comp为两区间合并规则。
 
- set_union, set_intersection, set_difference, set_symmetric_difference

注：有序集合的运算
 
- inplace_merge 分段有序合成总体有序

{% highlight c++ %}
void inplace_merge(BidirectionalIterator first,
                          BidirectionalIterator middle,
                          BidirectionalIterator last);
void inplace_merge(BidirectionalIterator first,
                          BidirectionalIterator middle,
                          BidirectionalIterator last, StrictWeakOrdering comp);
{% endhighlight %}       