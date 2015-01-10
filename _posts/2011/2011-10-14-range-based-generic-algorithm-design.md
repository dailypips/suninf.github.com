---
layout: article
title: 基于Range的泛型算法设计
category: c++
---

本文介绍基于range的C++泛型算法设计的方式。

## 先来看一下STL的整体框架：

- 容器
    - vector、list、set、map、multi_map等
- 迭代器
    - 每一种容器都配备自己独立的迭代器类型：Container::iterator
- 配接器
    1. 容器配接器：如stack、queue
    2. 迭代器配接器：如3种Insert Iterator、Stream Iterator、Reverse Iterator
    3. 仿函数配接器：如bind1st，not1，mem_fun等
- STL算法库
 
STL由于其通用泛型以及优异的性能和可靠性，得到广泛的使用，不过也有许多不方便需要改进的地方。比如：bind1st等仿函数配接器，由于只支持从std:: binary_function继承的标准仿函数，灵活性收到很大限制，仿函数配接器完全可以用boost::function和boost::bind替代。
 
还有一个就是近100个泛型函数组成的STL算法库，其设计的基本原则：

1. 算法基本针对序列操作（建议尽量少使用循环，多使用算法），输入的序列使用迭代器对的形式`[ first, one_past_last )`，即两个迭代器指定序列。
2. 返回值多样性，但是对于“得到”特征迭代器位置的算法，一般返回迭代器的位置。
3. 所有变更性算法，仅改变内容，不会真正删除序列元素。
4. 不少操作性的函数支持函数或仿函数，也有不少需要谓词，这样确实方便，特别是lambda表达式可以就地写以后。（目前C++03支持在函数内写仿函数也还算可以）。
5. 为了输出或者用谓词判断，增加了很多_copy、_if版本。
 
正如Andrei Alexandrescu的[“Iterator Must Go”](https://github.com/boostcon/2009_presentations/blob/master/wed/iterators-must-go.pdf){: target="_blank"}中所说，STL的算法虽然设计的高效，但是基于迭代器的算法设计使得灵活性和简洁性受到很大的限制，也阻碍了STL算法的更广泛的使用。并提出了基于Range的设计，来弥补STL算法简洁灵活性方便的缺陷。
 
另一方面，boost.Range库在1.43中升级为range2.0，对基于range的算法做了全面的支持，值得推荐使用。
 
## STL算法与Range算法做几个比较：

### 过滤序列中的为奇数的元素

{% highlight c++ %}
// STL：
#include <algorithm>
#include <vector>
 
int main()
{
    int input[] = {1,2,3,4,5,6,7};
 
    struct back_inserter_helper
    {
       back_inserter_helper(std::vector<int>& vec) : vec_(vec) {}
 
       void operator() ( int n )
       {
           if ( n%2 == 1 )
           {
              vec_.push_back(n);
           }
       }
       std::vector<int>& vec_;
    };
 
    // 没有copy_if
    std::vector<int> vec;
    std::for_each( input, input + sizeof(input)/sizeof(int), back_inserter_helper(vec) );
 
    return 0;
}
{% endhighlight %}

{% highlight c++ %}
// Range:
#include <boost/range/algorithm.hpp>
#include <boost/range/adaptor/filtered.hpp>
 
#include <vector>
 
int main()
{
    int input[] = {1,2,3,4,5,6,7};
 
    struct is_odd
    {
       bool operator() (int n) const {return n%2==1; }
    };
 
    std::vector<int> vec;
    boost::copy( input | boost::adaptors::filtered( is_odd() ), std::back_inserter(vec) );
 
    return 0;
}
{% endhighlight %}

说明：

1. range引入了Range的概念，取代之前的区间，由于Range的概念，使得算法直接支持容器、内建数组等、更加简洁。
2. 对Range支持配接器的概念，可以改变Range的行为，并且是缓式计算，直到对配接的Range在遍历时才起作用。
 
 
### 对一个序列进行排序，并删除重复的项

{% highlight c++ %}
// STL：
#include <iostream>
#include <algorithm>
#include <vector>
 
int main()
{
    int input[] = {1,2,3,2,6,3,4,5,6,7};
    std::vector<int> vec( input, input + sizeof(input)/sizeof(int) );
 
    std::sort( vec.begin(), vec.end() );
    std::vector<int>::iterator fit = std::unique( vec.begin(), vec.end() );
    if ( fit != vec.end() )
    {
       vec.erase( fit, vec.end() );
    }
    std::copy( vec.begin(), vec.end(), std::ostream_iterator<int>( std::cout, " " ) );
 
    return 0;
}
{% endhighlight %}

输出：1 2 3 4 5 6 7

{% highlight c++ %}
// Range：
#include <boost/range/algorithm_ext/erase.hpp>
#include <boost/range/algorithm.hpp>
 
#include <iostream>
#include <vector>
 
int main()
{
    int input[] = {1,2,3,2,6,3,4,5,6,7};
    std::vector<int> vec( input, input + sizeof(input)/sizeof(int) );
 
    boost::copy(
       boost::erase( vec, boost::unique<boost::return_found_end>(boost::sort(vec)) ),
       std::ostream_iterator<int>( std::cout, " " )
       );
 
 
    return 0;
}
{% endhighlight %}

说明：

1. Range的查找性的算法如unique，返回值可以定制，可以返回迭代器，也可以返回range，这样使得函数调用可以折叠；sort也一样，排序后返回range。也因为这样，使得算法调用得到了很大的灵活性。（上面是一句话调用实现）
2. Range还增加了真正操作的算法，如erase，push_back等，这些最终调用容器的成员函数操作。

一句话，Range的概念引入到泛型算法设计，给了算法使用极大的灵活性，Just do it。