---
layout: article
title: regex in boost
category: boost
---

在文本处理过程中常常格式验证、文本替换、文本格式化等，这时使用正则表达式就非常方便。C++标准库(TR1)已经引入了std::regex，基本是按照boost::regex来实现的。
 
使用regex库首先需要了解正则表达式规则，另一方面，regex库功能很强大，但是内容也很多。
 
## regex类的基本使用，头文件`<boost\regex.hpp>`

regex类其实是模板类basic_regex的一个特化：

~~~~
typedef basic_regex<char>      regex;
typedef basic_regex<wchar_t>   wregex;
（由于regex内部管理一个正则表达式字符串，所以基本用法有点类似string）
~~~~

### 介绍regex类的成员函数和最基本的非成员函数。

1、构造函数

~~~~
explicit basic_regex (); // 空的regex对象
 
explicit basic_regex(const  charT* p, flag_type f = egex_constants::normal);
用字符串常量来构造，如：regex re(“zhenshan”);
 
basic_regex(const basic_regex&); // 复制构造
 
template <class ST, class SA>
explicit basic_regex(const basic_string<charT, ST,  SA>& p,
        flag_type f = regex_constants::normal);
从一个string来构造，比如：regex re( string(“zhenshan”) );
 
basic_regex(const charT* p, size_type len, flag_type f = regex_constants::normal);
从字符数组构造，只要我们在提供有效长度

如：      
    char strs[100] = "\\sj\\w";
    regex re( strs, 5 );// 5个有效字符
 
template <class InputIterator>
basic_regex(InputIterator first, InputIterator last,
flag_type f = regex_constants::normal);
用区间来初始化（用指向字符的迭代器对或者指针对来初始化）

如：
    char strs[100] = "\\sj\\w";
    regex re1( strs, strs+5 );// 指针对

    string str("zhenshan");
    regex re2( str.begin(), str.end() );//迭代器对
~~~~

2、赋值运算符

赋值运算符的三个重载版本对应构造函数的三个单参数版本，仅列出，很容易理解。

~~~~
basic_regex& operator=(const basic_regex&);
 
basic_regex& operator= (const charT* ptr);
 
template <class ST, class SA>
basic_regex& operator= (const basic_string<charT, ST, SA>& p);
~~~~
 
3、修改regex（对应于构造函数）

对应于构造函数的五个版本（除了默认构造函数），也仅列出

~~~~
basic_regex& assign(const basic_regex& that);
 
basic_regex& assign(const charT* ptr,
flag_type f = regex_constants::normal);
 
basic_regex& assign(const charT* ptr, unsigned int len,
flag_type f = regex_constants::normal);
 
template <class string_traits, class A>
basic_regex& assign(const basic_string<charT, string_traits, A>& s,
flag_type f = regex_constants::normal);
 
template <class InputIterator>
basic_regex& assign(InputIterator first, InputIterator last,
flag_type f = regex_constants::normal);
~~~~

注：构造函数、赋值运算符、assign分配，都要求参数决定的正则表达式有效，否则将抛出regex_error异常。
 
4、其他有用成员函数

~~~~
void swap(basic_regex&);// 交换两个regex对象
 
bool empty() const; // 判断是否包含有效的正则表达式
 
basic_string<charT> str() const;// 返回包含的正则表达式对应的字符串
 
unsigned mark_count()const;
// 返回regex中用括号括起来的子表达式的数目
 
flag_type flags() const;
//我们可以从构造函数看到默认是regex_constants::normal
// 位掩码：
regex_constants::normal
regex_constants::icase
regex_constants::basic
regex_constants::extended
regex_constants::awk
regex_constants::grep
regex_constants::egrep
regex_constants::perl
regex_constants::literal
 
int compare(basic_regex& re) const;
当falgs() == re.flags()时，返回str().compare( re.str() )，即：基于string的compare；否则，返回falgs() - re.flags()
~~~~

5、非成员函数

~~~~
template <class charT, class io_traits, class re_traits>
basic_ostream<charT, io_traits>&
   operator << (basic_ostream<charT, io_traits>& os,
               const basic_regex<charT, re_traits>& e);
// 可以直接输出，等价于 os << e.str()
 
template <class charT, class traits>
void swap(basic_regex<charT, traits>& e1,
         basic_regex<charT, traits>& e2);
非成员函数的swap
 
其他还包括运算符：==, !=, <, <=, >, >= 都是基于成员函数compare

比如：
template <class charT, class traits>
bool operator < (const basic_regex<charT, traits>& lhs,
               const basic_regex<charT, traits>& rhs);
返回：lhs.compare(rhs) < 0.
~~~~
 
总结：类似string的方便接口，使我们处理regex对象本身很容易，很灵活。
 
 
## 使用regex类来处理文本的算法函数

到目前为止，真正regex的核心才刚刚开始。
 
### regex_match完全匹配函数

1、regex_match的重载函数

{% highlight c++ %}
template <class BidirectionalIterator, class Allocator, class charT, class traits>
bool regex_match(BidirectionalIterator first, BidirectionalIterator last,
                             match_results<BidirectionalIterator, Allocator>& m,
                             const basic_regex <charT, traits>& e,
                             match_flag_type flags = match_default);
// match_results对象引用传入，报告子表达式的匹配情况
 
template <class BidirectionalIterator, class charT, class traits>
bool regex_match(BidirectionalIterator first, BidirectionalIterator last,
                             const basic_regex <charT, traits>& e,
                             match_flag_type flags = match_default);
 
template <class charT, class Allocator, class traits>
bool regex_match(const charT* str,
                             match_results<const charT*, Allocator>& m,
                             const basic_regex <charT, traits>& e,
                             match_flag_type flags = match_default);
 
template <class charT, class traits>
bool regex_match(const charT* str,
                             const basic_regex <charT, traits>& e,
                             match_flag_type flags = match_default);
 
template <class ST, class SA, class Allocator, class charT, class traits>
bool regex_match(const basic_string<charT, ST, SA>& s,
match_results<typename basic_string<charT, ST, SA>::const_iterator, Allocator>& m,
                             const basic_regex <charT, traits>& e,
                             match_flag_type flags = match_default);
 
template <class ST, class SA, class charT, class traits>
bool regex_match(const basic_string<charT, ST, SA>& s,
                             const basic_regex <charT, traits>& e,
                             match_flag_type flags = match_default);
{% endhighlight %}

总之：参数是一对双向迭代器（或者字符串常量，或者string），一个可选的match_results对象，一个regex对象。
 
2、match_results类介绍
 
正则表达式和许多简单的模式匹配算法不同，既能寻找全部的匹配，也能产生子表达式的匹配：在模式中通过一双括号`(...)`界定的每个子表达式。需要有某种方法来向用户报告子表达式的匹配结果：这是通过定义类match_results(子表达式匹配的有序集合)来实现的，每个子表达式匹配都包含在一个sub_match类型的对象中。
 
- 模板类match_results表示一个表达正则表达式匹配结果的字符序列的集合。 
- match_results类的对象被传入到算法regex_match和regex_search中，被迭代器regex_iterator返回。 
- 集合的存储空间在需要时由类match_results的成员函数申请和释放。
 
类模板match_results最经常使用的是下面的typedef之一， cmatch、wcmatch、smatch或wsmatch：

{% highlight c++ %}
typedef match_results<const char*>              cmatch;
typedef match_results<const wchar_t*>           wcmatch;
typedef match_results<string::const_iterator>   smatch;
typedef match_results<wstring::const_iterator>  wsmatch;
{% endhighlight %}

(1)、成员函数

{% highlight c++ %}
match_results(const match_results& m);
 
match_results& operator=(const match_results& m);
 
size_type size() const;
// 返回*this中sub_match元素的数量； 等于正则表达式中标记子表达式的数量加上1
 
bool empty() const; // 即返回size() == 0
 
difference_type length(int sub = 0) const;
// 第sub个子表达式的长度，即(*this)[sub].length().
 
difference_type position(unsigned int sub = 0) const;
// 返回子表达式sub的开始位置，如果没有匹配则返回-1。 注意，如果这表示一个部分匹配，即使(*this)[0].matched值为false，position()也会返回部分匹配的位置。
 
const_reference operator[](int n) const;
// 返回表示标记子表达式n匹配的字符序列的sub_match的对象的引用。 如果n == 0，则返回表示匹配整个正则表达式的字符序列的sub_match的对象的引用。 
// 如果n越界，或者n是一个未匹配的子表达式，则返回一个sub_match对象，其matched成员是false。
 
string_type str(int sub = 0) const;// 子表达式sub作为字符串返回
 
const_reference prefix() const;
//返回一个sub_match对象的引用，这个对象表示从要进行匹配或搜索的字符串的开始，到匹配的开始之间的字符序列。
 
const_reference suffix() const;
//返回一个sub_match对象的引用，这个对象表示从匹配的结束，到用于匹配或搜索的字符串的结束之间的字符序列。
 
const_iterator begin() const;
// 返回用于遍历*this存储的所有标记子表达式匹配的起始迭代器。
// 其实它就指向 *this[0]
 
const_iterator end() const;

void swap(match_results& that);

template <class OutputIterator>
OutputIterator format(OutputIterator out,
                   const string_type& fmt,
                   match_flag_type flags = format_default) const;
// 将字符序列[fmt.begin(), fmt.end())拷贝到OutputIterator out。 
// 对于fmt中每个格式说明(format specifier)或转义序列，用它表示的字符(串)，或它指向的*this中的字符序列来替换它。
 
string_type format(const string_type& fmt,
                     match_flag_type flags = format_default) const;
{% endhighlight %}

替换语法：

- 普通字符是直接替换
- Fmt格式化字符串的特殊替换字符
    - $n : 代表匹配的第n个子表达式的内容
    - $$或者$ : 代表$本身
    - $& : 代表匹配到字符串内容
    - $` : 代表原字符串中，匹配到的内容之前的字符串，键盘左上角"~"下边的那个符号。
    - $' : 代表原字符串中，匹配到的内容之后的字符串，单引号。
 
注：关于format的例子，参阅后面的regex_replace函数

(2)、非成员函数

{% highlight c++ %}
template <class BidirectionalIterator, class Allocator>
bool operator == (const match_results<BidirectionalIterator, Allocator>& m1,
                  const match_results<BidirectionalIterator, Allocator>& m2);
 
template <class BidirectionalIterator, class Allocator>
bool operator != (const match_results<BidirectionalIterator, Allocator>& m1,
                  const match_results<BidirectionalIterator, Allocator>& m2);
 
template <class BidirectionalIterator, class Allocator>
void swap(match_results<BidirectionalIterator, Allocator>& m1,
         match_results<BidirectionalIterator, Allocator>& m2);
{% endhighlight %}

注：match_results对象m，则`m[0]`对应整个匹配，`m[1], m[2], …, m[size()-1]`分别对应第n个子表达式。
 
 
3、sub_match类型介绍

匹配括号包含的每个子表达式匹配都包含在一个sub_match类型的对象中：

- sub_match类型的对象只能通过match_results类型对象的下标得到。
- sub_match类型的对象可以同类型`std::basic_string、const charT*或const charT`进行比较( `==. !=, <, <=, >, >=` )
- 如果标记子表达式由正则表达式匹配中参与的sub_match类型的对象表示， 那么成员matched为true， 并且成员first和second表示形成匹配的字符范围`[first,second)`。 否则，matched为false， 成员first和second的值未定义。
- 当用sub_match表示的标记子表达式被重复时，sub_match对象表示最后一次重复得到的匹配。
 
{% highlight c++ %}
typedef sub_match<const char*>                    csub_match;
typedef sub_match<const wchar_t*>                 wcsub_match;
typedef sub_match<std::string::const_iterator>    ssub_match;
typedef sub_match<std::wstring::const_iterator>   wssub_match;
 
bool matched;// sub_match是否参与了匹配
 
difference_type length()const;// 子表达式匹配的长度
 
operator basic_string<value_type>()const;// 可以自动转化为string
 
basic_string<value_type> str()const;
// 如果匹配，返回匹配的字符串，否则，返回空。
 
// 以下是三个比较函数
int compare(const sub_match& s)const;
int compare(const basic_string<value_type>& s)const;
int compare(const value_type* s)const;
{% endhighlight %}

注：sub_match类一般不用直接用到，因为它只能通过match_results取下标得到，而且在需要的环境，又能自动的转化为string。
 
4、regex_match用于字符串完全匹配验证

例子：

{% highlight c++ %}
#include <string>
#include <iostream>
using namespace std;
 
#include <boost\regex.hpp>
using namespace boost;
 
int main()
{ // 匹配模式：“3个数字，1个单词，1个任意的字符，2个数字或者字符串N/A，// 1个空格，然后重复第一个单词”
    regex reg( "\\d{3}([a-zA-Z]+).(\\d{2}|N/A)\\s\\1" );
    string correct = "123abc0N/A abc";
    smatch m;
    if( regex_match(correct, m, reg) )
    {
        cout << m.size() << endl;
        // 下标遍历
        for ( size_t i=0; i<m.size(); ++i )
        {
            cout << m[i] << endl;// 自动转化为string，等价于m[i].str()
        }
        // 迭代器遍历
        for ( smatch::const_iterator it=m.begin(); it!=m.end(); ++it )
        {
            cout << *it << endl;
        }
        cout << m.position(1) << endl;// 从a开始
    }
    if ( ! regex_match( "000happy000 Happy", reg ) )// 可以不用m记录
    {
        cout << "Not Match" << endl;
    }

    return 0;
}
{% endhighlight %}


### regex_search查找函数（查找第一次匹配）

1、regex_search重载函数

{% highlight c++ %}
template <class BidirectionalIterator, class Allocator, class charT, class traits>
bool regex_search(BidirectionalIterator first, BidirectionalIterator last,
                  match_results<BidirectionalIterator, Allocator>& m,
                  const basic_regex<charT, traits>& e,
                  match_flag_type flags = match_default);
 
template <class BidirectionalIterator, class charT, class traits>               
bool regex_search(BidirectionalIterator first, BidirectionalIterator last,
                  const basic_regex<charT, traits>& e,
                  match_flag_type flags = match_default);
                 
template <class ST, class SA, class Allocator, class charT, class traits>
bool regex_search(const basic_string<charT, ST, SA>& s,
match_results<typename basic_string<charT, ST,SA>::const_iterator, Allocator>& m,
                  const basic_regex<charT, traits>& e,
                  match_flag_type flags = match_default);
 
template<class ST, class SA, class charT, class traits>
bool regex_search(const basic_string<charT, ST, SA>& s,
                  const basic_regex<charT, traits>& e,
                  match_flag_type flags = match_default);
         
template<class charT, class Allocator, class traits>
bool regex_search(const charT* str,
                  match_results<const charT*, Allocator>& m,
                  const basic_regex<charT, traits>& e,
                  match_flag_type flags = match_default);
                 
template <class charT, class traits>
bool regex_search(const charT* str,
                  const basic_regex<charT, traits>& e,
                  match_flag_type flags = match_default);
{% endhighlight %}
 
总之：参数是一对双向迭代器（或者字符串常量，或者string），一个可选的match_results对象，一个regex对象。（与regex_match完全一致）
 
效果：判断在字符串内是否存在某个子序列匹配正则表达式e，参数flags用来控制表达式如何匹配字符序列。 如果存在这样的序列则返回true，否则返回false。
 
注意：

- 当函数返回false时，m是未定义的
- 当返回true时，则有

|---
| 元素 | 值
|-|:-|:-:|-:
| `m.size()` | `e.mark_count()` 
| `m.empty()` | false
| `m.prefix().first` | first
| `m.prefix().last` | `m[0].first` 
| `m.prefix().matched` | `m.prefix().first != m.prefix().second` 
| `m.suffix().first` | `m[0].second` 
| `m.suffix().last` | last
| `m.suffix().matched` | `m.suffix().first != m.suffix().second` 
| `m[0].first` | 匹配正则表达式的字符串的开始
| `m[0].second` | 匹配正则表达式的字符串的末尾
| `m[0].matched` | `完全匹配才返回true，即使部分匹配也返回false` 
| `m[n].first` | 对于整数 `n < m.size()`, 第n子表达式匹配字符串的开始位置；不参与匹配返回last（常与string连用，类型为string::const_iterator迭代器）
| `m[n].second` | 对于整数 `n < m.size()`, 第n子表达式匹配字符串的开始位置；如果第n子表达式不参与匹配，则返回last. 
| `m[n].matched` | 对于整数 `n < m.size()`,第n子表达式参与匹配,返回true，否则 false. 


2、使用regex_search

与regex_match的验证性匹配相比，regex_search是在给定字符串中，寻找第一个完全匹配。

例子：

{% highlight c++ %}
#include <string>
#include <iostream>
using namespace std;
 
#include <boost\regex.hpp>
using namespace boost;
 
int main()
{
    regex reg( "\\d{3}([a-zA-Z]+).(\\d{2}|N/A)\\s\\1" );

    string correct = "000123abc0N/A abcfds123sjw055 sjwjkgd";
    smatch m;
    string::const_iterator st= correct.begin();
    string::const_iterator ed = correct.end();

    while( regex_search(st, ed, m, reg) )// 把各个匹配都找出来
    {
        // 下标遍历
        for ( size_t i=0; i<m.size(); ++i )
        {
               cout << m[i] << endl;// 自动转化为string，等价于m[i].str()
        }
        cout << m.prefix() << "<>" << m.suffix() << endl;
        st = m[0].second;// 完全匹配的字符串的下一个位置作为下一次搜索起点
    }

    return 0;
}
{% endhighlight %}


### regex_replace替换函数

1、重载函数

~~~~
template <class OutputIterator, class BidirectionalIterator, class traits, class charT>
OutputIterator regex_replace(OutputIterator out,
                             BidirectionalIterator first,
                             BidirectionalIterator last,
                             const basic_regex<charT, traits>& e,
                             const basic_string<charT>& fmt,
                             match_flag_type flags = match_default);

算法regex_replace在字符串搜索正则表达式的所有匹配： 对于每个匹配，调用match_results<>::format来格式化字符串并将结果送到输出迭代器中。 如果flags参数没有设置标签format_no_copy，那么没有匹配的文本部分将被原封不动地拷贝到输出。 如果设置了标签format_first_only，那么只有第一个匹配被替换，而不是所有匹配的地方。
 
 
template <class traits, class charT>
basic_string<charT> regex_replace(const basic_string<charT>& s,
                                  const basic_regex<charT, traits>& e,
                                  const basic_string<charT>& fmt,
                                  match_flag_type flags = match_default);
~~~~
 
说明：本质想法是把一个字符串中符合正则表达式格式的字符串替换为自定义的某种格式，其他的字符不变，从而得到新的字符串。
 
2、regex_replace的使用

例子：

{% highlight c++ %}
#include <string>
#include <iostream>
#include <iterator>
using namespace std;
 
#include <boost\regex.hpp>
using namespace boost;
 
int main()
{
    // (1)
    regex reg( "\\d{3}([a-zA-Z]+).(\\d{2}|N/A)\\s\\1" );

    string correct = "000123abc0N/A abcfds123sjw055 sjwj000";
    string::const_iterator st= correct.begin();
    string::const_iterator ed = correct.end();
    string tmp;

    // 使用输出迭代器
    regex_replace( back_inserter(tmp), st, ed, reg, string("$1pm$2") );
    cout << tmp << endl;

    // 使用字符串
    tmp = regex_replace( correct, reg, "$1ppmm$2" );
    cout << tmp << endl;

    // (2) 不区分大小写，把colour都改为color
    reg = regex( "(colo)(u)(r)", regex::icase );
    string s = "Colour, colours, Colourize";
    s = regex_replace( s, reg, "$1$3" );
    cout << s << endl;

    return 0;
}
{% endhighlight %}
 
输出：  
000abcpmN/Afdssjwpm55j000  
000abcppmmN/Afdssjwppmm55j000  
Color, colors, Colorize
 
### regex_iterator 自动匹配迭代器（非常精彩）

迭代器类型regex_iterator遍历在序列中找到的所有正则表达式匹配：解引用regex_iterator会返回指向match_results对象的引用。
 
1、相关定义

{% highlight c++ %}
typedef  basic_regex<charT, traits>            regex_type;
typedef  match_results<BidirectionalIterator>  value_type;
 
// 构造函数
regex_iterator();
// 默认产生指向为空的迭代器（可以作为匹配失败的末端迭代器）
 
regex_iterator(  BidirectionalIterator start,
                            BidirectionalIterator end,
              const regex_type& reg,
              match_flag_type m = match_default);
//构造regex_iterator， 用于遍历表达式re在序列[a,b)内的所有出现
 
regex_iterator(const regex_iterator&);
 
regex_iterator& operator=(const regex_iterator&);// 赋值
 
// 比较运算
bool operator==(const regex_iterator&)const;
bool operator!=(const regex_iterator&)const;
 
// 解引用，返回match_results的对象
const value_type& operator*()const;
const value_type* operator->()const;
 
// 自增, 将迭代器移到潜在序列的下次匹配， 如果不存在下次匹配则为序列迭// 代器的结尾。
regex_iterator& operator++();
regex_iterator operator++(int);
 
// 自定义方便使用
typedef regex_iterator<const char*>                  cregex_iterator;
typedef regex_iterator<std::string::const_iterator>  sregex_iterator;
{% endhighlight %}
 
2、使用

{% highlight c++ %}
#include <string>
#include <iostream>
#include <iterator>
using namespace std;
 
#include <boost\regex.hpp>
using namespace boost;
 
int main()
{
    regex reg( "\\d{3}([a-zA-Z]+).(\\d{2}|N/A)\\s\\1" );

    string correct = "000123abc0N/A abcfds123sjw055 sjwj000";
    string::const_iterator st= correct.begin();
    string::const_iterator ed = correct.end();

    sregex_iterator it( st, ed, reg );
    while ( it != sregex_iterator() )
    {// 下面的三个定义变量都得到smatch对象，然后可以对它操作
        smatch m = *it;// 解引用得到smatch对象
        const smatch& mm = *it; // 用引用时注意返回的是const 引用
        sregex_iterator::value_type mmm = *it;

        cout << m << endl;
        ++it;
    }

    return 0;
}
{% endhighlight %}
 
## 总结：

- regex类的使用，regex_match，regex_search，还有迭代器sregex_iterator都是为了得到match_results对象，因为它包含了整个匹配以及各个子表达式匹配的信息，我们需要的也就是这个match_results对象；
- 而函数regex_replace内部也是间接用了match_results，只是直接进行了格式化。