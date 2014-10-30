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
    (// 注：因为有+=，右边的_1可以是qi::_1或spirit::_1，而不是phoenix::arg_names::_1
    // 在其他情况phoenix::arg_names::_1均为有效的，仅在用于动作语义并且涉及运算符时无效
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

### 一元分析器UnaryParser

一元分析器UnaryParser 包含一个对象，行为由委托设计模式而定

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


### 不定数分析器NaryParser

`a | b | c … `
: （**择一符**）多个分析器中选择第一个匹配的( first-match-wins )，之后的被短路不再搜索匹配。

注意属性Attribution：

|---
| a: A, b: B | `(a | b): variant<A, B>` // 因为可能匹配a，b中的任意一个
| a: A, b: Unused | `(a | b): optional<A>` //因为可能匹配b
| a: A, b: B, c: Unused | `(a | b | c): optional<variant<A, B> >`
| a: Unused, b: B | `(a | b): optional<B>`
| a: Unused, b: Unused | `(a | b): Unused`
| a: A, b: A | `(a | b): A`


`a > b > c …`
: （**期望序列**）相对于普通的序列符>>，期望序列要求更严格，即：如果a匹配失败，则整个匹配失败；之后必须能匹配b，然后匹配c…，否则抛出异常`expectation_failure<Iter>`，（第二个分析器及之后的必须要匹配，因为是期望的），而普通序列只会返回失败。

属性说明：

|---
| a: A, b: B | `(a > b): tuple<A, B>`
| a: A, b: Unused | `(a > b): A`
| a: Unused, b: B | `(a > b): B`
| a: Unused, b: Unused | `(a > b): Unused`
| a: A, b: A | `(a > b): vector<A>`
| `a: vector<A>`, b: A | `(a > b): vector<A>`
| `a: A, b: vector<A>` | `(a > b): vector<A>`
| `a: vector<A>, b: vector<A>` | `(a > b): vector<A>`

`a ^ b ^ c …`
: （**排列符**）以任意的排列次序匹配一个或者多个算子（a, b, c …）。

例如：`char_('a') ^ 'b' ^ 'c'` 可以匹配 "a", "ab", "abc", "cba", "bca" ... 等。

属性：

|----
| a: A, b: B | `(a ^ b): tuple<optional<A>, optional<B> >`
| a: A, b: Unused | `(a ^ b): optional<A>`
| a: Unused, b: B | `(a ^ b): optional<B>`
| a: Unused, b: Unused | `(a ^ b): Unused`

`a >> b >> c …`
: （**序列符**）按次序逐个匹配算子（a, b, c …），如果将匹配值填入对应的属性，即使匹配失败（prase等解析返回false），部分匹配成功的值也会写入对应的属性。

属性：

|----
| a: A, b: B | `(a >> b): tuple<A, B>`
| a: A, b: Unused | `(a >> b): A`
| a: Unused, b: B | `(a >> b): B`
| a: Unused, b: Unused | `(a >> b): Unused`
| a: A, b: A | `(a >> b): vector<A>`
| `a: vector<A>, b: A` | `(a >> b): vector<A>`
| `a: A, b: vector<A>` | `(a >> b): vector<A>`
| `a: vector<A>, b: vector<A>` | `(a >> b): vector<A>`

例子：

{% highlight c++ %}
boost::fusion::vector<char, char> attr; 
test_parser_attr("xy", char_ >> char_, attr);
std::cout << boost::fusion::at_c<0>(attr) << ',' 
  << boost::fusion::at_c<1>(attr) << std::endl;
{% endhighlight %}

{% highlight c++ %}
std::vector<char> vec;
test_parser_attr("xy", char_ >> char_, vec);
std::cout << vec[0] << ',' << vec[1] << std::endl;
{% endhighlight %}

`(char_ >> char_)[std::cout << _1 << ',' << _2 << std::endl]`

`a || b || c …`
: (**或序列**)即`( a||b )||c，对于a||b来说，是匹配a>>b或a或b，即(a>>b)|a|b或者(a>>-b) | b`，是有优先顺序的。

注意属性：

|----
| `a||b||c` | `tuple<A,B,C>` 不管是否每个值都匹配上，把匹配得到的对应值写入对应位置。
| `a: A, b: A` | `(a || b): vector<A>`
| `a: vector<A>, b: A` | `(a || b): vector<A>`
| `a: A, b: vector<A>`| `(a || b): vector<A>`
| `a: vector<A>, b: vector<A>` | `(a || b): vector<A>`

### 非终端分析器Nonterminal

它是分析表达式语法的一个语法片段，可以引用自身而产生递归，它是递归下降解析的重要基础。

签名（Signature）
: 签名指定Nonterminal的合成（synthesized）和继承（inherited）属性，语法为`RT(A0, A1, A2, ..., AN)`，其中RT是合成属性，A0,A1…AN是继承属性。签名用于rule或者grammar的声明。

属性（Attributes）
: Nonterminal的属性对应一个函数型，组合属性类似于函数返回值，继承属性类似于函数参数。

- `spirit::qi::_val`：该占位符对应于Nonterminal的组合属性，可以在定义Nonterminal时的语义动作中使用代表整个grammar或者rule的值。
- `spirit::_r1…_rN`（注意是从_r1开始的）对应于Nonterminal的继承属性，也用于语义动作。
- 如果有继承属性，则使用时基元（primitive）和非终端分析器可以带额外的属性：`p( a1, a2, ..., aN )`，其中ai可以是立即数或者函数f，其签名为 `T f( unused, Contetx )`返回的T为要求的参数类型，这样的函数格式是为了语义动作的一致性。

注意：

1. 继承属性是可以根据需要任意指定的，一般用于初始化，条件判断选择等，当然也肯定可以设计的很复杂。使用rule或者grammar时，直接可以调用需要的继承属性值，得到的语法传给API分析器。
2. 分析器的分析之后，我们都期望得到相应的结果，而组合属性就是对应于相应的结果，所以语义动作中要一直对_val进行处理，这样最后调用api函数时就可以指定attr的结果放到哪里；另一种方法是嵌入式的，我们不必指定合成属性，语义动作中也不对_val进行处理，但是我们要对需要处理的属性用ref导入到语义动作中，这样也能得到相应的结果。

本地变量（Locals）
: 可以让Nonterminal在解析时使用栈上的局部变量。

{% highlight c++ %}
template <typename T0, typename T1, typename T2, ..., typename TN>
struct locals;
{% endhighlight %}

- 预定义的 `boost::spirit::_a, _b, ..., _j`分别对应上述的T0..T9，用于语义动作。
- 本地变量可以在语义动作中被初始化（比如记录当前的匹配部分的属性值），它对应特殊的类型；完成初始化之后可以在后面的表达式中使用，包括可以作为能接受继承属性的分析器的参数以及在语义动作中使用。

### rule

rule：命名一个赋值给它的语法表达式，可以被引用或者甚至引用自己而产生递归。

{% highlight c++ %}
template <typename Iterator, typename A1, typename A2, typename A3>
struct rule;
{% endhighlight %}

- A1,A2,A3分别对应与Signature, Skipper, Locals（可任意顺序），默认都是unused_type
- 注意：我们一般都会用Signature来指定属性来处理匹配结果；而如果使用phrase_prase来解析，则需要制定Skipper类型，并在phrase_prase中指定对应的内置skip。

|----
| 表达式 | 说明
|-|:-|:-:|-:
| `rule<Iterator, A1, A2, A3> r(name);` | name是可选的string，用于调试和错误处理
| `rule<Iterator, A1, A2, A3> r(r2);` | 拷贝构造
| r = r2; | 赋值
| r.alias() | 别名，返回自身的引用
| r.copy() | 返回自身的拷贝
| r = p;	| 规则定的义。 
| `r %= p`; | 自动规则定义，要求p的属性必须适合r的合成属性；如果p成功，它的属性自动传递到r的合成属性。

- 签名signature（即属性attribute）的使用

{% highlight c++ %}
#include <iostream>
#include <string>
#include <iterator>
#include <algorithm>
#include <vector>
using namespace std;

#include <boost/spirit/home/qi.hpp>
#include <boost/spirit/home/phoenix.hpp>
#include <boost/fusion/container.hpp>

using namespace boost::spirit;

int main()
{
  string str = "1234 4567 7890";
  vector<int> vect;
  int d;
  namespace phx = boost::phoenix;
  
  // 注意组合属性为 vector<int>
  qi::rule< string::iterator, vector<int>(), ascii::space_type > 
    r1 = *qi::int_[ phx::push_back(_val,_1) ]; // 利用phoenix的函数对象push_back
  bool b = qi::phrase_parse( str.begin(), str.end(), r1, ascii::space, vect  );
  if ( b )
  {
    copy( vect.begin(), vect.end(), ostream_iterator<int>( cout, " " ) );
    cout << endl; // 输出1234 4567 7890
  }

  // 组合属性int，继承属性也为int
  // 单个继承属性用_r1引用
  qi::rule< string::iterator, int( int ), ascii::space_type > 
    r2 = qi::int_[ _val = _1 + _r1 ] >> *qi::int_[ _val += _1 ]; 
  b = qi::phrase_parse( str.begin(), str.end(), r2(10), ascii::space, d );
  if ( b )
  {// 输出13701 即：10 + 1234+4567+7890 其中10自己给定的初值（通过继承属性）
    cout << d << endl; 
  }

  return 0;
}
{% endhighlight %}



- Locals 局部变量，在语义动作完成初始化之后，在当前之后的语法中可以到处使用，因为它是语法的一个局部变量了。

{% highlight c++ %}
#include <iostream>
#include <string>
#include <iterator>
using namespace std;

#include <boost/spirit/home/qi.hpp>
#include <boost/spirit/home/phoenix.hpp>
#include <boost/fusion/container.hpp>

using namespace boost::spirit;

int main()
{
  string str = "1 1 34 4567 7890";
  qi::rule< string::iterator, qi::locals<string,int, int>, ascii::space_type > 
    r1 = ascii::string("1 1")[_a = _1] >> 
      qi::int_[_b=_1, _c=_b+1] [ cout << _a << " " << _b << " " << _c << endl ] ;
  
  // 输出：1 1 34 35
  bool b = qi::phrase_parse( str.begin(), str.end(), r1, ascii::space ); 

  return 0;
}
{% endhighlight %}


### grammar

语法包装了一系列规则，包括基元分析器和子语法，它是模块化和组合的主要机制，语法可以组合成更加复杂的语法。

{% highlight c++ %}
template <typename Iterator, typename A1, typename A2, typename A3>
struct grammar;
{% endhighlight %}

与rule的模板参数一致，A1,A2,A3是可以任意顺序的Signature, Skipper, Locals

- 语法类的定义：

{% highlight c++ %}
template <typename Iterator>
struct my_grammar : grammar<Iterator, A1, A2, A3>
{
  my_grammar() : my_grammar::base_type(start, name)
  {
    // Rule definitions
    start = /* ... */;
  }

  rule<Iterator, A1, A2, A3> start;
  // more rule declarations...
};
{% endhighlight %}

- 一个简单的例子：

{% highlight c++ %}
#include <iostream>
#include <string>
using namespace std;

#include <boost/spirit/home/qi.hpp>
#include <boost/spirit/home/phoenix.hpp>
#include <boost/fusion/container.hpp>

using namespace boost::spirit;

template<typename Iter>
struct num_list : qi::grammar<Iter, ascii::space_type>
{
  num_list() : base_type(start)
  {
    num = qi::int_;
    start = num[cout << _1 << endl ] % ','; // 列表操作符
  }

  qi::rule<Iter, ascii::space_type> start;
  qi::rule<Iter, int(), ascii::space_type> num; // 注意num给定一个int的合成属性
};

int main()
{
  string s = "123,45, 567,4";
  num_list<string::iterator> g;
  qi::phrase_parse( s.begin(), s.end(), g, ascii::space );

  return 0;
}
{% endhighlight %}


## 解析器 API

### 基于迭代器的API

- parse: 基于字符层面的分析，不会过滤字符。
- phrase_parse: 基于语义层面的分析，要求提供一个指定过滤的分析器。

声明： 
{% highlight c++ %}
parse( Iterator& first, Iterator last, Expr const& expr);

parse( Iterator& first, Iterator last, Expr const& expr, 
    Attr1& attr1, Attr2& attr2, ..., AttrN& attrN);

phrase_parse( Iterator& first, Iterator last, Expr const& expr, 
    Skipper const& skipper
    , BOOST_SCOPED_ENUM(skip_flag) post_skip = skip_flag::postskip);

phrase_parse( Iterator& first, Iterator last, Expr const& expr, 
    Skipper const& skipper
    , Attr1& attr1, Attr2& attr2, ..., AttrN& attrN);

phrase_parse( Iterator& first, Iterator last, Expr const& expr, 
    Skipper const& skipper, BOOST_SCOPED_ENUM(skip_flag) post_skip
    , Attr1& attr1, Attr2& attr2, ..., AttrN& attrN);
{% endhighlight %}

注意：

1. 只有当所有的分析器组件都匹配成功才返回true。
2. 只有分析的语法是>>连接的序列，才能使用多个对应类型的属性参数；此时也可以用一个tuple去接受。

例如：

- api内嵌临时分析表达式，多属性接受

{% highlight c++ %}
#include <iostream>
#include <string>
#include <iterator>
#include <algorithm>
#include <vector>
using namespace std;

#include <boost/spirit/home/qi.hpp>
#include <boost/spirit/home/phoenix.hpp>

#include <boost/fusion/container.hpp>
#include <boost/fusion/sequence.hpp>

using namespace boost;
using namespace boost::spirit;

int main()
{
  string s = "123 .45  567 4";
  int ss;
  double dd;

  qi::phrase_parse( s.begin(), s.end(), 
    ( qi::int_ >> qi::double_ ),
    ascii::space,
    ss, 
    dd );

  cout << ss << " " << dd << endl; // 输出：123 0.45

  return 0;
}
{% endhighlight %}

- api内嵌临时分析表达式，tuple接受 （展示main主体）

{% highlight c++ %}
string s = "123 .45  567 4";
fusion::vector<int,double> vv;

qi::phrase_parse( s.begin(), s.end(), 
  (
  qi::int_ >> qi::double_
  ),

  ascii::space,
  vv // 用元组来接受
  );

cout << fusion::at_c<0>(vv) << " " << 
  fusion::at_c<1>(vv) << endl; //输出：123 0.45
{% endhighlight %}

- 具有元组属性的规则(非临时表达式)，只能用元组来接受

{% highlight c++ %}
string s = "123 .45  567 4";
fusion::vector<int,double> vv;

// 语义动作注意使用phoenix::at_c<N>( seq )
qi::rule<string::iterator, fusion::vector<int,double>(), ascii::space_type >
  rl = qi::int_[ phoenix::at_c<0>(_val) = _1 ] 
>> qi::double_[ phoenix::at_c<1>(_val) = _1 ];

qi::phrase_parse( s.begin(), s.end(), 
  rl,
  ascii::space,
  vv
  );
cout << fusion::at_c<0>(vv) << " " << 
  fusion::at_c<1>(vv) << endl; //输出：123 0.45
{% endhighlight %}

- 注意到phrase_parse带属性的有两个版本，一个有skip_flag参数，而另一个没有，它的作用是当一次成功的匹配完成后，是否继续跳过指定的Skipper类型的符号（默认为继续跳过），我们可以显示指定不要跳过。

{% highlight c++ %}
string s = "123   .45  567 4";
int n;
double d;
string::iterator it = s.begin();
qi::phrase_parse( it, s.end(), // 我们跟踪下it的位置
  ( qi::int_>>qi::double_ ),
  ascii::space,
  // 默认等价于qi::skip_flag::postskip,
  n, 
  d
  );
cout << d << string(it,s.end()) << endl; // 输出：0.45567 4
{% endhighlight %}

{% highlight c++ %}
string s = "123   .45  567 4";
int n;
double d;
string::iterator it = s.begin();
qi::phrase_parse( it, s.end(), 
  ( qi::int_>>qi::double_ ),
  ascii::space,
  qi::skip_flag::dont_postskip, // 禁止成功后跳过
  n, 
  d
  );
cout << d << string(it,s.end()) << endl; // 输出：0.45  567 4
{% endhighlight %}

### 补充说明

语义动作一般最适合使用phoenix提供的机制，它封装了lazy机制，适合STL的lazy算法机制，还包括适合元组tuple的 `phoenix::at_c<N>( Tuple )`，让lambda的书写更简洁。
 
- lazy分析器：分析器也是对象，如果某个函数可以返回一个分析器，可以让它在延迟到分析时再计算，这样有时也会有用的。
- 最简单的lazy方式：`val(qi::int_ >> qi::double_)`或者 `lazy( val( ascii::char_ ) )`等。


## 内置分析器

### 二进制

关于二进制的自带分析器有byte_, word, dword等，暂不介绍。

### 字符 char_, lit

注意是放在不同的字符集名字空间的。char_对应的字符类型为其属性。
{% highlight c++ %}
boost::spirit::qi::ascii 
boost::spirit::qi::iso8859_1 
boost::spirit::qi::standard 
boost::spirit::qi::standard_wide
qi::lit
{% endhighlight %}

char_
: 可以匹配对应字符集下的任意一个字符

char_(ch)
: 匹配一个提供的字符。

char_( first, last )
: 可以匹配范围内的任意一个字符。要求first在last之前

char( def )
: def是一个字符串常量或者`basic_string<ch>`的对象，它采用正则表达式指定单个字符的语法，只不过中括号对用引号对来表示。

例如：
{% highlight c++ %}
char_("a-zA-Z")     // 字母
char_("0-9a-fA-F")  // 十六进制符号
char_("actgACTG")   // DNA 符号
char_("\x7f\x7e")   // 十六进制来表示字符：0x7F and 0x7E
{% endhighlight %}

lit(ch)
: 匹配一个字符，不过它没有属性

~cp
: cp是指上述的char分析器，属性也为cp的属性，表示可以匹配除了被cp能匹配的所有字符

**注意（by Hartmut Kaiser）**：

1. lit(“str”), “str”, ‘s’或者lit(‘s’)是按照内存中对应的整数值（bit pattern）来匹配的，所以就是字面值，并且只消耗，不得到属性，不涉及到不同字符集的概念。
2. string_, char_等之所以要放在不同的名字空间下，是因为它们除了能代表字面值之外，还有功能型函数例如space, alnum以及char_(“a-zA-Z”)等，所以会涉及不同的字符集对应不同的情况，于是需要封装到不同的名字空间（ascii, standard_wide等）。

### 分类字符

ns指代字符集名字空间，如ascii

ns::alnum 字母和数字  
ns::alpha 字母  
ns::blank 空格，tab  
ns::cntrl 控制字符  
ns::digit 数字  
ns::graph non-space printing characters  
ns::lower 小写字母  
ns::print 可打印字符  
ns::punct 标点符号  
ns::space 即space，tab，return，newline  
ns::upper 大写字母  
ns::xdigit 十六进制符号  


### 数字

- 无符号数分析器

{% highlight c++ %}
template 
<
  typename T //属性
  , unsigned Radix // 进制，默认10
  , unsigned MinDigits //最小位数，默认1
  , int MaxDigits
> //最大位数，-1表示不限，默认-1
struct uint_parser;
{% endhighlight %}

一些内置的无符号分析器：

|----
| 分析器 | 语义 
|-|:-|:-:|-:
| bin | 二进制 `uint_parser<unsigned, 2, 1, -1>`
| oct | 八进制 `uint_parser<unsigned, 8, 1, -1> `
| hex | 十六进制 `uint_parser<unsigned, 16, 1, -1> `
| ushort_ | 短整型 `uint_parser<unsigned short, 10, 1, -1> `
| ulong_ | 长整型 `uint_parser<unsigned long, 10, 1, -1> `
| uint_ | `uint_parser<unsigned int, 10, 1, -1> `
| ulong_long | `uint_parser<unsigned long long, 10, 1, -1> `

- 有符号整数分析器

{% highlight c++ %}
template 
<
  typename T
  , unsigned Radix
  , unsigned MinDigits
  , int MaxDigits
>
struct int_parser;
{% endhighlight %}

|----
| short_ | `int_parser<short, 10, 1, -1> `
| long_ | `int_parser<long, 10, 1, -1> `
| int_ | `int_parser<int, 10, 1, -1> `
| long_long | `int_parser<long long, 10, 1, -1> `

- 实数分析器

{% highlight c++ %}
template 
<
  typename T, 
  typename RealPolicies // 控制行为的policy
> 
struct real_parser;
{% endhighlight %}

|----
| float_ |	`real_parser<float, real_policies<T> > `
| double_ |	`real_parser<double, real_policies<T> > `
| long_double |	`real_parser<long double, real_policies<T> > `

- 内置boolean型分析器（属性bool）

`bool_`：可以匹配”true”或者”false”字符串  
`true_`：匹配”true”  
`false_`：匹配”false”  


### 字符串分析器

- ns::string( s )：s可以是字符串常量或者std::string，skipper在ns::string分析器之中无效的，因为它是完整的单元，对应的属性为 `std::basic_string<T>`
- lit( s )：除了lit不具有属性，其它与string一致

## phoenix语义动作的说明

p[ phoenix-lambda-expression ]，几种占位符：

- _1, _2…_N：对应与分析器p的属性，例如>>连成的序列；rule，grammar的合成属性可有可无，因此最多为_1
- _val：rule或者grammar（封闭语法）的合成属性的指代。
- _r1, _r2…_rN：rule或者grammar（封闭语法）的逐个继承属性
- _a,_b,…,_j：对应于rule或者grammar 的局部变量locals。


## 应用实例

- 支持double的计算器

计算器语法（支持+, -, *, /, (, ), +(正)，-(负)）：

表达式	
`expression = term >> *( (‘+’ >> term) | (‘-’ >> term) );`  

项		
`term = factor >> *( (‘*’ >> factor) | (‘/’ >> factor) );`  

因子  

~~~~
    factor = double_ 
        | ( ‘(’>> expression >>’)’ )
        | ( ‘-’ >> factor )
        | ( ‘+’ >> factor );
~~~~

例程：
{% highlight c++ %}
#include <iostream>
#include <string>
#include <boost/spirit/home/qi.hpp>
#include <boost/spirit/home/phoenix.hpp>

using namespace boost;
using namespace boost::spirit;

template
<	
  typename Iter = std::string::iterator, 
  typename Skipper = ascii::space_type 
>
struct calc : qi::grammar< Iter, double(), Skipper >
{
  calc() : calc::base_type( expression, "calc" )
  {
    expression = term[_val = _1] >>
      *( ('+' >> term[_val += _1] ) | ('-' >> term[_val -= _1] ) );

    term = factor[ _val = _1 ] >>
      *( ('*' >> factor[_val *= _1] ) | ('/' >> factor[_val /= _1] ) );

    factor = qi::double_ [ _val = _1 ]
      | ( '(' >> expression[ _val = _1 ] >> ')' )
      | ( '-' >> factor[ _val = -_1 ] )
      | ( '+' >> factor );
  }
  qi::rule<Iter, double(), Skipper> expression, term, factor;
};

int main()
{
  std::string s = " (-2.5 * (5+3) - 15 / 5) * (-3) + ( 7 - 3)*2 ";
  double d = 0;
  bool bok = qi::phrase_parse( s.begin(), s.end(), calc<>(), ascii::space, d );
  if ( bok )
  {
    std::cout << d << std::endl; // 计算结果：77
  }

  return 0;
}
{% endhighlight %}


- 找出简单的Tag标记

假设：`<script … > … </script   >` // … 任意非标记控制；结尾>之前可以有空格换行等

{% highlight c++ %}
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <iterator>
using namespace std;

#include <boost/spirit/home/qi.hpp>
#include <boost/spirit/home/phoenix.hpp>
using namespace boost::spirit;
namespace phx = boost::phoenix;

template< typename Iter >
struct get_script : qi::grammar< Iter, string() >
{
  get_script() : get_script::base_type( expression )
  {
    expression = start[_val = _1] >> 
      *( (ascii::char_- ascii::char_('<'))[phx::push_back(_val, _1)] ) >> 
      end[ _val += _1 ];

    start = qi::no_case[ ascii::string("<script") ][ _val = _1 ] >> 
      *( ( ascii::char_ - '>' )[phx::push_back(_val, _1)] ) >> 
      ascii::char_('>')[ phx::push_back(_val, _1) ];

    end = &lit('<') >> qi::no_case[ascii::string("</script")][_val = _1] >> 
      *( ascii::space[phx::push_back(_val, _1)] ) >> 
      ascii::char_('>')[phx::push_back(_val, _1)];
  }
  qi::rule<Iter, string()> expression, start, end;
};

void ParseScript( const string& src, vector<string>& cont )
{
  string::const_iterator it = src.begin();
  while ( it != src.end() )
  {
    string str;
    if ( qi::parse( it, src.end(), get_script<string::const_iterator>(), str ) )
    {
      cont.push_back( str );
    }
    else
      ++it;
  }
}

int main()
{
  string s = "test --- <SCript ... > ... </scriPT > \
             --- test <script ... > ... </script	>--- test";
  vector<string> vect;
  ParseScript( s, vect );
  copy( vect.begin(), vect.end(), ostream_iterator<string>(cout, "\n") );

  return 0;
}
{% endhighlight %}


- 中缀表达式转化为后缀表达式

处理语法解析问题的基本思想是：先把语法用EBNF范式描述清楚，然后根据需要得到什么属性，确定对应的语义规则是什么，最后对应的写出语义动作。

{% highlight c++ %}
#include <iostream>
#include <string>
#include <boost/spirit/home/qi.hpp>
#include <boost/spirit/home/phoenix.hpp>
using namespace std;
using namespace boost;
using namespace boost::spirit;

// 中缀表达式转成后缀表达式
template
<	
  typename Iter = string::iterator, 
  typename Skipper = ascii::space_type 
>
struct calc : qi::grammar< Iter, string(), Skipper >
{
  calc() : calc::base_type( expression, "calc" )
  {
    expression = term[_val = _1] >>
      *( ('+' >> term[_val += _1+string("+ ")] ) |
      ('-' >> term[_val += _1+string("- ")] ) );

    term = factor[ _val = _1 ] >>
      *( ('*' >> factor[_val += _1 + string("* ")] ) | ('/' >> factor[_val += _1 + string("/ ")] ) );

    factor = (+((ascii::digit|ascii::char_('.'))[ phoenix::push_back(_val,_1) ]))[ phoenix::push_back(_val,' ') ]
    | ( '(' >> expression[ _val = _1 ] >> ')' )
      | ( '-' >> factor[ _val = string("0 ")+_1+string("- ") ] )
      | ( '+' >> factor );
  }
  qi::rule<Iter, string(), Skipper > expression, term, factor;
};

int main()
{
  string s = " (-2.5 * (5+3) - 15 / 5) * (-3) + ( 7 - 3)*2 ";
  string str;
  bool bok = qi::phrase_parse( s.begin(), s.end(), calc<>(), ascii::space, str );
  if ( bok )
  {
    std::cout << str << std::endl;// 0 2.5 - 5 3 + * 15 5 / - 0 3 - * 7 3 - 2 * +
  }

  return 0;
}
{% endhighlight %}

- 自定义分析器 （可以使用rule或者grammar来实现）

{% highlight c++ %}
#include <iostream>
#include <string>
#include <complex>
#include <boost/spirit/home/qi.hpp>
#include <boost/spirit/home/phoenix.hpp>
using namespace std;
using namespace boost;
using namespace boost::spirit;

// 假设复数 a + bi 在字符串中是（a, b）的形式
// 用rule来写
qi::rule< string::iterator, complex<double>(), ascii::space_type, qi::locals<double,double> >
  complex_r = ascii::char_('(') >> qi::double_[_a = _1] >> ',' 
  >> qi::double_[_b = _1] >> ascii::char_(')')[ _val = phoenix::construct< complex<double> >(_a,_b) ];

// 用grammar来写
struct complex_g 
  : qi::grammar< string::iterator, complex<double>(), ascii::space_type,  qi::locals<double,double> >
{
  complex_g() : base_type( start )
  {
    start = ascii::char_('(') >> qi::double_[_a = _1] >> ',' 
      >> qi::double_[_b = _1] >> ascii::char_(')')[ _val = phoenix::construct< complex<double> >(_a,_b) ];
  }
  qi::rule< string::iterator, complex<double>(), 
    ascii::space_type, qi::locals<double,double> > start;
};

int main()
{

  string s = "(3.14, 50.1) (3.14, 5.2)";
  vector< complex<double> > vect;

  qi::phrase_parse( s.begin(), s.end(), 
    complex_r >> complex_g() // 连续两个复数
    , ascii::space, vect );
  cout << vect[0] << endl;
  cout << vect[1] << endl;

  return 0;
}
{% endhighlight %}

不过两者是有区别的，rule定义的是变量，而grammar可以得到一个类型。



## 使用Qi的总结

1. 可以选择两个分析器API，语义层面的phrase_parse和字符层面的parse。
2. 对于分析器的选择，如果真的是小问题，可以直接嵌入到API函数中，如果问题稍微有点复杂，则需要使用rule或者更加完整的grammar。
3. grammar类似于一系列rule的封装，它们的模板参数完全一致。一般来说，我们解析一个字符串，自然想得到我们想要的部分，这时有两种思路，一种是给grammar指定属性；另一种是嵌入式的，可以是外部的可访问的变量用phoenix::ref(v)的形式包装起来，用于action语义，可以保存相关的信息，也可以是grammar类的数据成员。不过，用属性的思想与分析器的设计更加一致，也更好理解。
4. 使用rule和grammar的基本思想：
	- 写一个grammar类，一般解决一个特定问题，而为了得到解析的结果，我们需要设定它的合成属性，如果允许外部提供初始化值，则需要添加继承属性。这个是由Signature模板参数控制的。
	- 如果是在语义层面上处理的，则需要设定Skipper，最后使用在phrase_parse中。
	- 如果发现书写动作语义时，遇到需要临时变量的情况，这时可以加入locals<T,…>来制定需要的变量对应的类型。
5. 对于需要解决一个具体的语法解析问题，语法分析清楚是书写真正的grammar类的基础，所以问题的语法分析非常重要。
