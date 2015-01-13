---
layout: article
title: tokenizer in boost
category: boost
---

tokenizer库提供了字符串的单词分割的容器和迭代器模型，这样可以让我们轻易的按照某些规则分割字符串，该库提供了可配置的3种常用的函数对象类型供选择，当然用户如果有需求可以自己按照规范写操作类型，配置使用。
 
## 容器模型 tokenizer

{% highlight c++ %}
template
< 
    class TokenizerFunc = char_delimiters_separator<char>,
    class Iterator = std::string::const_iterator,
    class Type = std::string
> 
class tokenizer;
{% endhighlight %}
 
tokenizer 类提供了一个容器视图，将一系列单词包含在一个序列中。当对这个序列进行访问时，TokenizerFunction将对序列进行分解，分解是在通过迭代器访问单词时才按需执行的。
 
### 成员函数：

{% highlight c++ %}
// 构造函数
tokenizer(Iterator first, Iterator last,
const TokenizerFunc& f = TokenizerFunc())
 
template<class Container>
tokenizer(const Container& c, const TokenizerFunc& f = TokenizerFunc())
 
// assign赋值
void assign(Iterator first, Iterator last)
 
void assign(Iterator first, Iterator last, const TokenizerFunc& f)
 
template<class Container>
void assign(const Container& c)
 
template<class Container>
void assign(const Container& c, const TokenizerFunc& f)
 
// 迭代器视图
iterator begin() const
iterator end() const
{% endhighlight %}

注意：

1. 基本思想：将字符串通过可以配置的分解函数进行分解，并提供了友好的迭代器访问方式，在访问时，对字符串逐步分解，直到结束为止。
2. 迭代器视图使用了迭代器包装类型token_iterator_generator
 
 
## 迭代器模型 token_iterator_generator

{% highlight c++ %}
template
< 
    class TokenizerFunc = char_delimiters_separator<char>,
    class Iterator = std::string::const_iterator,
    class Type = std::string
>
class token_iterator_generator
{
public:
    typedef token_iterator<TokenizerFunc,Iterator,Type> type;
};
{% endhighlight %}

内部使用了真正实现了细节的token_iterator，它才是真正的迭代器。

另外，还提供了简单的全局函数来通过给定的迭代器区间生成分解的迭代器：

{% highlight c++ %}
template<class Type, class Iterator, class TokenizerFunc>
typename token_iterator_generator<TokenizerFunc,Iterator,Type>::type
make_token_iterator(Iterator begin, Iterator end, const TokenizerFunc& fun)
{
    typedef typename token_iterator_generator<TokenizerFunc,Iterator,Type>::type ret_type;
    return ret_type(fun,begin,end);
}
{% endhighlight %}

注意到，容器模型tokenizer可以通过容器或者迭代器区间来构造，内部也已经使用了迭代器的实现，而且提供了友好的接口，一般来说，我们直接使用容器是比较好的想法。
 
 
## 分解函数 TokenizerFunction

容器模型tokenizer的真正行为完全由policy类型TokenizerFunction控制。
 
TokenizerFunction 是一个函数对象，其目的是分析一个给定的序列，直至找到一个单词或到达序列末尾。然后它更新该单词，并通知调用者当前单词之后的下一步字符的位置。
 
### 语义要求：

|---
| 标识 | 说明 
|-|:-|:-:|-:
| `func` | 类型 TokenizerFunction的对象
| `tok` | 单词对象
| `next` | 指向被分析序列中第一个未分析字符的迭代器
| `end` | 指向被分析序列末尾的迭代器
| `func(next, end, tok)` | next 和 end 是同一序列的有效迭代器。next 是函数可自由修改的引用。tok 是已构造的。返回值表示是否在序列 `[next,end)` 中找到新单词；如果返回值为 true, 则新单词被赋给 tok. next 总是被更新为下一次调用时开始分析的位置。

 
### 预定义的函数对象：

1、char_separator
: char_separator 类基于字符分隔符来分解一个字符序列，并且对于分隔符和空白符的控制可以配置。
 
带参数构造函数：

~~~~
explicit char_separator(
    const Char* dropped_delims,
    const Char* kept_delims = "",
    empty_token_policy empty_tokens = drop_empty_tokens )
~~~~

注意：

- dropped_delims：分隔符不会出现在输出单词中。
- kept_delims：分隔符出现在输出单词中
- empty_tokens：如果为 drop_empty_tokens, 则空白单词不会出现在输出中；如果为 keep_empty_tokens 则空白单词将出现在输出中。
 
默认构造函数：`explicit char_separator()`  
则使用函数 std::isspace() 来识别被弃分隔符，同时使用 std::ispunct() 来识别保留分隔符。另外，抛弃空白单词。
 
例如：

{% highlight c++ %}
#include <iostream>
#include <boost/tokenizer.hpp>
#include <string>
 
int main()
{
    std::string str = ";;Hello|world||-foo--bar;yow;baz|";
 
    boost::char_separator<char> sep("-;", "|" );
 
    typedef boost::tokenizer<boost::char_separator<char> > tokenizer;
    tokenizer tokens(str, sep);
 
    for (tokenizer::iterator tok_iter = tokens.begin();
       tok_iter != tokens.end(); ++tok_iter)
       std::cout << *tok_iter << "\n";
 
    return 0;
}
{% endhighlight %}
 
2、escaped_list_separator
: escaped_list_separator 对一个 csv (逗号分隔) 格式进行分解。当然也支持更复杂的配置。

字段通常以逗号分隔。如果你想把逗号放入字段中，你就要用引号把它括起来。
 
还支持转义：

|---
| 转义序列 | 结果 
|-|:-|:-:|-:
| `<escape><quote>` | `<quote>`
| `<escape>n` | newline
| `<escape><escape>` | `<escape>`

其中 `<quote>` 是指定为引号的任意字符，而 `<escape>` 则是指定为转义字符的任意字符。
 
支持两种构造：

(1)、单字符构造，提供了默认值

`explicit escaped_list_separator(Char e = '\\', Char c = ',',Char q = '\"')`

|---
| 参数 | 描述 
|-|:-|:-:|-:
| e | 指定用作转义的字符。缺省使用 C 风格的 `\` (反斜杠)。但是你可以传入不同的字符来覆盖它。你可能会这样做的一个例子是，如果你有很多字段是 Windows 风格的文件名时，路径中的每个 `\` 都要转义。你可以使用其它字符作为转义字符。
| c | 指定用作字段分隔的字符，默认使用逗号
| q | 指定用作引号的字符


(2)、字符串构造

`escaped_list_separator(string_type e, string_type c, string_type q):`

|---
| 参数 | 描述 
|-|:-|:-:|-:
| e | 字符串 e 中的字符都被视为转义字符。如果给定的是空字符串，则没有转义字符。
| c | 字符串 c 中的字符都被视为分隔符。如果给定的是空字符串，则没有分隔符。
| q | 字符串 q 中的字符都被视为引号字符。如果给定的是空字符串，则没有引号字符。
 
例如：

{% highlight c++ %}
#include<iostream>
#include<boost/tokenizer.hpp>
#include<string>
 
int main()
{
    std::string s = "Field 1,\"putting quotes around fields, allows commas\",Field 3";
 
    boost::tokenizer<boost::escaped_list_separator<char> > tok(s);
 
    for( boost::tokenizer<boost::escaped_list_separator<char> >::iterator beg=tok.begin();
       beg!=tok.end(); ++beg )
    {
       std::cout << *beg << "\n";
    }
 
    return 0;
}
{% endhighlight %}

输出：  
Field 1  
putting quotes around fields, allows commas  
Field 3  
 
3、offset_separator
: ffset_separator 按偏移量将一个字符序列分解为多个字符串。例如，如果你有一个字符串 "12252001" 和偏移量 (2,2,4)，则它将该字符串分解为 12 25 2001
 
构造函数：

~~~~
template<typename Iter>
offset_separator(Iter begin,Iter end,bool bwrapoffsets = true, bool breturnpartiallast = true)
~~~~

|---
| 参数 | 描述 
|-|:-|:-:|-:
| `begin, end` | 指定整数偏移量序列
| bwrapoffsets | 指明当所有偏移量用完后是否回绕到偏移量序列的开头继续。例如字符串 "1225200101012002" 用偏移量 (2,2,4) 分解，如果 bwrapoffsets 为 true, 则分解为 12 25 2001 01 01 2002. 如果 bwrapoffsets 为 false, 则分解为 12 25 2001，然后就由于偏移量用完而结束。
| breturnpartiallast | 指明当被分解序列在生成当前偏移量所需的字符数之前结束，是否创建一个单词，或是忽略它。例如字符串 "122501" 用偏移量 (2,2,4) 分解，如果 breturnpartiallast 为 true，则分解为 12 25 01. 如果为 false, 则分解为 12 25，然后就由于序列中只剩下2个字符不足4个而结束。
 
4、另外还有一个要被遗弃的函数对象类char_delimiters_separator

尽管该类目前是tokenizer的默认模板参数，但是我们使用时可以使用char_separator来显示的使用。