---
layout: article
title: spirit.Qi in boost
category: c++
description: spirit.Qi 是强大高效的语法分析器
---

*spirit.Qi (`namespace boost::spirit::qi`)是强大高效的语法分析器，spirit（boost版本1.41以上）对传统的spirit库进行了彻底的改写，传统的spirit库为现在库的一部分Classic而向后兼容，其他几个新内容：Q1, Karma, Lex 和 Phoenix。本文介绍分析器Qi，它和Karma是相对的孪生兄弟，一个用于解析，另一个逆向格式化。*

## 语义动作（Semantic Actions）

语法的任意一点的分析器(parser) **P** 都能绑定一个动作 — 函数（对象）**F**，P[F]，函数的签名类型取决于所绑定的分析器，其第一参数对应分析器的属性（attribute）。

注意：比如 `double_[ F ]`

- F对应普通函数 `f(double n)` 时，则F为 `&f`

- F对应函数对象（或C++0x支持的函数对象时），参数需要3个，第一个是需要的double，第二个是分析器上下文（context），第三个是bool型的hit引用，不过后面两个参数我们不需要使用，spirit允许我们简单的使用`qi::unused_type`来占位。

{% highlight c++ %}
struct print // F为print()
{
	void operator()( double n, qi::unused_type, qi::unused_type ) { 
	  cout<<n<<endl; 
	}
};
{% endhighlight %}

或使用lambda表达式: `[](double n, qi::unused_type, qi::unused_type){ cout<<n<<endl; }`

- 另外，如果使用boost::bind（绑定普通函数、成员函数或者函数对象（不需要额外的两个参数））来得到函数对象，以及用boost::lambda来得到函数对象，它们不需要额外的两个qi::unused_type参数。

例如：  
{% highlight c++ %}
struct print
{
	void operator()( double n ) { cout<<n<<endl; }
};
{% endhighlight %}

可以使用 `double_[ boost::bind<void>( print(), _1 ) ]`


- Phoenix非常适合spirit的动作语义

{% highlight c++ %}
// 将一列逗号分隔的实数累加
namespace qi = boost::spirit::qi;
namespace ascii = boost::spirit::ascii;
namespace phoenix = boost::phoenix;
using qi::double_;
using qi::_1; // bind, phoenix, spirit都有自己的占位符，使用时要明确区分
using ascii::space;
using phoenix::ref;

template <typename Iterator>
bool adder(Iterator first, Iterator last, double& n)
{
    bool r = qi::phrase_parse(first, last,
        //  Begin grammar
        (// 注意：因为有+=，右边的_1可以是qi::_1或者spirit::_1，而不是phoenix::arg_names::_1
		// 在其他情况phoenix::arg_names::_1均为有效的，仅在用于动作语义并且涉及运算符时无效。
            double_[ref(n) = _1] >> *(',' >> double_[ref(n) += _1]) 
        )
        //  End grammar
        ,
        space);
    if (first != last) // fail if we did not get a full match
        return false;
    return r;
}
{% endhighlight %}


## Qi分析器

所有的Qi分析器是一下的分析器模型Parser Concepts之一：

- 基元分析器 PrimitiveParser
- 一元分析器 UnaryParser
- 二元分析器 BinaryParser
- 不定分析器 NaryParser
- 非终端分析器 Nonterminal

### Qi分析器Parser

它有一个成员函数parse，来处理一段输入的分析任务。  
`p.parse(f, l, context, skip, attr)` 匹配[f, l)对应的区间，匹配成功返回true，否则为false

参数说明：

- context ：分析器的上下文信息 或者 不使用unused
- skip ：忽略信息 或者 unused
- attrib ：分析器匹配内容对应的属性类型变量(例如double_对应double的变量) 或者 unused

注：区间开始迭代器f为引用传递的，如果匹配成功，f将指向l同一位置；匹配失败也有对应的规则，不过一般不依赖于匹配失败的情况。

### 基元分析器 PrimitiveParser

- attr(a)：创建一个伪分析器（不能与其他分析器合用），不消耗任何输入，总是匹配成功，指明属性的类型与值。

{% highlight c++ %}
double d;
string str = "";
qi::phrase_parse( str.begin(), str.end(), attr(1.0), ascii::space, d); // d为1.0
{% endhighlight %}

- eoi：End Of Input 当传入区间为空时，匹配成功，属性unused

- eol：End Of Line ，创建一分析器，当匹配到\r, \n, \r\n时匹配成功，属性也不可用

- eps：创建一个分析器，它有两个常用功能：
    1. 直接使用，必能匹配一个长度为0的串( `r = a | b | c | eps[ error() ];` // 如果a, b, c都匹配失败，则报错 )
	2. 预判语义，接受一个在计算时返回true或false的Lazy参数，如果返回false，则分析直接失败，否则匹配一个空串，分析继续。
	
- symbols：实现了一个符号表，以字符串作为关键字key的关联容器

{% highlight c++ %}
// lookup默认为tst_map三元状态树实现
template <typename Char, typename T, typename Lookup> 
struct symbols;
{% endhighlight %}

|---
| 支持的表达式 | 语义 
|-|:-|:-:|-:
| Sym() | 空的符号表
| Sym(sym) |	拷贝构造
| Sym(sseq) | key字符串从STL序列sseq得到，值用默认值填充
| Sym(sseq, dseq) | 关键字和值分别从 sseq 和 dseq 得到
| sym = sym2 | 符号表赋值
| `sym = s1, s2, ..., sN` | 一些符号赋值给 sym. 
| `sym += s1, s2, ..., sN` | 增加一些符号 symbols (s1...sN) 给 sym. 
| `sym.add(s1)(s2)...(sN)` | 同+=，可以穿插键值对的add
| `sym.add(s1, d1)(s2, d2)...(sN, dN)` | 增加键值对 `symbols (s1.,d1) … (sN, dN)` 到 sym.
| `sym -= s1, s2, ..., sN` | 删除一些键值
| `sym.remove(s1)(s2)...(sN)` | 同-=
| sym.clear() | 清空符号表
| sym.at(s) | 返回s对应的值的引用，如果原不存在，用默认值插入
| sym.find(s) | 返回key对应的值的指针，不存在为0
| sym.for_each(f) | 对于符号表中的每一组键值对，调用 f(s, d). 
	
作为分析器，符号表的属性是值的类型T，可以匹配一个字符串符号，默认大小写敏感，如果用no_case[ sym ]包装起来，大小写不敏感，但是sym的字符串要求原来是小写的，否则导致失配。

{% highlight c++ %}
symbols<char, int> sym;
sym.add
    ("apple", 1)    // symbol strings are added in lowercase...
    ("banana", 2)
    ("orange", 3);
int i;
test_parser_attr("Apple", no_case[ sym ], i);
std::cout << i << std::endl;
{% endhighlight %}

### 一元分析器UnaryParser 包含一个对象，行为由委托设计模式而定

`&a`
: and预判（窥探），进行下一次扫描前做预判，如果能匹配成功，返回一0长度的串，即不会消耗数据，预判失败，则fail而不继续进行匹配。

`*a`
: Kleene Star克林星号，匹配对象a零次或多次（贪婪的），如果a对应的属性为A，则*a对应的属性为vector<A>

`lexeme[a]`
: 禁用skipper，字符层面的匹配（boost::spirit::lexeme），不做忽略，属性为a的属性

`ns::no_case[a]`
: 忽略大小写的匹配，属性为a的属性

`!a`
: not预判，与`&a`类似，也不消耗输入，但是意义恰好相对，`&a`当a匹配时失败，否则才成功匹配，返回长度为0的串。

`omit[a]`
: 忽略a的属性，这样包含omit[a]的整个表达式属性，将不考虑这一项。

`+a`
: 匹配对象一次或者多次，a的属性为A，则`+a`的属性为`vector<A>`

`raw[ a ]`
: 不管a的属性为什么，raw[a]的属性为字符串属性，一般为string

`repeat`
: 属性为`vector<A>`，除非a为unused，则也为unused

`repeat[a]`
: 与*a等价

|---
| repeat(n)[a] | 匹配a确切的n次
| repeat(min, max)[a] | 至少min次匹配，至多max次，但尽量多次
| repeat(min, inf)[a] | 至少min次匹配 

`skip`
: 不改变a原来的属性

|---
| skip[a] | 与lexeme相对，重新使用原来的忽略器
| skip(p)[a] | 使用p为忽略器


### 二元分析器BinaryParser（有left和right两个分析器）

`a - b`
: Difference，匹配左边a但不能匹配b，例如：`char_ - "*/"`匹配除`*/`以外的字符

`a % b`
: 以b分割的a的列表，等价于 `a>>*(b>>a)`，如果a的属性为A，则a%b的属性为`vector<A>`


