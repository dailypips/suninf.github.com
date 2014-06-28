---
layout: article
title: String in javascript
category: javascript
description: 本文详细介绍javascript中的字符串处理，包括String对象的使用，以及正则表达式RegExp的相关细节。
---
*本文详细介绍javascript中的字符串处理，包括**String对象**的使用，以及**正则表达式RegExp**的相关细节。*

字符串是JavaScript的一种基本的数据类型。JavaScript 的字符串是不可变的（immutable），String 类定义的方法都不能改变字符串的内容。像`String.toUpperCase()`这样的方法，返回的是全新的字符串，而不是修改原始字符串。

## String对象

### 创建 String 对象的语法：
{% highlight javascript %}
new String(s);
String(s);
{% endhighlight %}

**参数:**  
参数 s 是要存储在 String 对象中或转换成原始字符串的值。

**返回值:**

* 当 String() 和运算符 new 一起作为构造函数使用时，它返回一个新创建的 String 对象，存放的是字符串 s 或 s 的字符串表示。
* 当不用 new 运算符调用 String() 时，它**只把 s 转换成原始的字符串**，并返回转换后的值。注意可以直接对原始的字符串进行属性和方法的调用，javascript会使用**包装对象**来保证程序的运行。



### String 对象属性

* constructor 对创建该对象的函数的引用
* **length 字符串的长度**
* prototype 允许您向对象添加属性和方法


### String 对象方法

* ‘+’ 连接字符串  
`var s = "hello" + " world";`

* ‘[]’ 读取指定位置上的值，不能修改  
{% highlight javascript %}
var s = '123';
s[1]; // “2”
{% endhighlight %}

* charAt() 返回在指定位置的字符  
请注意，JavaScript 并没有一种有别于字符串类型的字符数据类型，所以返回的字符是长度为 1 的字符串。

* charCodeAt() 返回在指定的位置的字符的 Unicode 编码

* concat()	连接字符串  
`stringObject.concat(stringX,stringX,...,stringX)`  
concat() 方法将把它的所有参数转换成字符串，然后按顺序连接到字符串 stringObject 的尾部，并返回连接后的字符串。请注意，stringObject 本身并没有被更改。

* fromCharCode() 从字符编码创建一个字符串  
`String.fromCharCode(numX,numX,...,numX)`  
该方法是 String 的静态方法，字符串中的每个字符都由单独的数字 Unicode 编码指定，因此它的语法应该是 String.fromCharCode()。

* indexOf() 检索字符串  
`stringObject.indexOf(searchvalue,fromindex)`  
返回某个指定的字符串值在字符串中首次出现的位置。

* lastIndexOf() 从后向前搜索字符串  
`stringObject.lastIndexOf(searchvalue,fromindex)`

* match() 找到一个或多个正则表达式的匹配  
`stringObject.match(searchvalue)`  
`stringObject.match(regexp)`  
在字符串内检索指定的值，或找到一个或多个正则表达式的匹配数组。它返回指定的值，而不是字符串的位置。


* replace() 替换与正则表达式匹配的子串  
`stringObject.replace(regexp/substr,replacement)`  
在字符串中用一些字符替换另一些字符，或替换一个与正则表达式匹配的子串。

* search() 检索与正则表达式相匹配的值  
`stringObject.search(regexp)`  
返回stringObject 中第一个与 regexp 相匹配的子串的起始位置；如果没有找到任何匹配的子串，则返回 -1。

* slice() 提取字符串的片断，并在新的字符串中返回被提取的部分  
`stringObject.slice(start,end)`  
**参数:**  
start：要抽取的片断的起始下标。如果是负数，则该参数规定的是从字符串的尾部开始算起的位置。也就是说，-1 指字符串的最后一个字符，-2 指倒数第二个字符，以此类推。  
end	：紧接着要抽取的片段的结尾的下标。若未指定此参数，则要提取的子串包括 start 到原字符串结尾的字符串。如果该参数是负数，那么它规定的是从字符串的尾部开始算起的位置。
**返回值:**  
返回一个新的字符串。包括字符串 stringObject 从 start 开始（包括 start）到 end 结束（不包括 end）为止的所有字符。
{% highlight javascript %}
var str="Hello happy world!"
str.slice(6) // “happy world!”
{% endhighlight %}

* split() 把字符串分割为字符串数组  
`stringObject.split(separator,howmany)`  
separator：必需，字符串或正则表达式，从该参数指定的地方分割 stringObject。  
howmany：可选，该参数可指定返回的数组的最大长度。如果设置了该参数，返回的子串不会多于这个参数指定的数组。如果没有设置该参数，整个字符串都会被分割，不考虑它的长度。

* substr() 从起始索引号提取字符串中指定数目的字符  
`stringObject.substr(start,length)`

* substring() 提取字符串中两个指定的索引号之间的字符  
`stringObject.substring(start,stop)`  
返回一个新的字符串，该字符串值包含 stringObject 的一个子字符串，其内容是从 start 处到 stop-1 处的所有字符，其长度为 stop 减 start。与 slice() 和 substr() 方法不同的是，substring() 不接受负的参数。

* toLowerCase() 把字符串转换为小写
* toUpperCase() 把字符串转换为大写


## 正则表达式 RegExp 对象
RegExp 对象表示正则表达式，它是对字符串执行模式匹配的强大工具。

### 语法
直接量语法:  
`/pattern/attributes`

创建 RegExp 对象的语法:  
`new RegExp(pattern, attributes);`

* 参数 pattern 是一个字符串，指定了正则表达式的模式或其他正则表达式。如果要**匹配字符`/`**，则需要使用`\/`
* 参数 attributes 是一个可选的字符串，包含属性 "g"、"i" 和 "m"，分别用于指定全局匹配、区分大小写的匹配和多行匹配。如果 pattern 是正则表达式，而不是字符串，则必须省略该参数。

返回值: 

* 一个新的 RegExp 对象，具有指定的模式和标志。如果参数 pattern 是正则表达式而不是字符串，那么 RegExp() 构造函数将用与指定的 RegExp 相同的模式和标志创建一个新的 RegExp 对象。
* 如果不用 new 运算符，而将 RegExp() 作为函数调用，那么它的行为与用 new 运算符调用时一样，只是当 pattern 是正则表达式时，它只返回 pattern，而不再创建一个新的 RegExp 对象。

异常:

* SyntaxError - 如果 pattern 不是合法的正则表达式，或 attributes 含有 "g"、"i" 和 "m" 之外的字符，抛出该异常。
* TypeError - 如果 pattern 是 RegExp 对象，但没有省略 attributes 参数，抛出该异常。

### 修饰符 

|---
| 修饰符 | 描述
|-|:-|:-:|-:
| i | 执行对大小写不敏感的匹配。
| g | 执行全局匹配（查找所有匹配而非在找到第一个匹配后停止）。
| m | 执行多行匹配。


### 方括号
方括号用于查找某个范围内的字符：

|---
| 表达式 | 描述
|-|:-|:-:|-:
|[abc] | 查找方括号之间的任何字符。
|[^abc] | 查找任何不在方括号之间的字符。
|[0-9] | 查找任何从 0 至 9 的数字。
|[a-z] | 查找任何从小写 a 到小写 z 的字符。
|[A-Z] | 查找任何从大写 A 到大写 Z 的字符。
|[A-z] | 查找任何从大写 A 到小写 z 的字符。
|[adgk] | 查找给定集合内的任何字符。
|[^adgk] | 查找给定集合外的任何字符。
|`(red|blue|green)` | 查找任何指定的选项。


### 元字符
元字符（Metacharacter）是拥有特殊含义的字符：

|---
| 元字符 | 描述
|-|:-|:-:|-:
|`.` | 查找单个字符，除了换行和行结束符。
|`\w` | 查找单词字符。
|`\W` | 查找非单词字符。
|`\d` | 查找数字。
|`\D` | 查找非数字字符。
|`\s` | 查找空白字符。
|`\S` | 查找非空白字符。
|`\b` | 匹配单词边界。
|`\B` | 匹配非单词边界。
|`\0` | 查找 NUL 字符。
|`\n` | 查找换行符。
|`\f` | 查找换页符。
|`\r` | 查找回车符。
|`\t` | 查找制表符。
|`\v` | 查找垂直制表符。
|`\xxx` | 查找以八进制数 xxx 规定的字符。
|`\xdd` | 查找以十六进制数 dd 规定的字符。
|`\uxxx` | 查找以十六进制数 xxxx 规定的 Unicode 字符。


### 量词

|---
| 量词 | 描述
|-|:-|:-:|-:
|`n+` | 匹配任何包含至少一个 n 的字符串。
|`n*` | 匹配任何包含零个或多个 n 的字符串。
|`n?` | 匹配任何包含零个或一个 n 的字符串。
|`n{X}` | 匹配包含 X 个 n 的序列的字符串。
|`n{X,Y}` | 匹配包含 X 或 Y 个 n 的序列的字符串。
|`n{X,}` | 匹配包含至少 X 个 n 的序列的字符串。
|`n$` | 匹配任何结尾为 n 的字符串。
|`^n` | 匹配任何开头为 n 的字符串。
|`?=n` | 匹配任何其后紧接指定字符串 n 的字符串。
|`?!n` | 匹配任何其后没有紧接指定字符串 n 的字符串。

### 小括号分组与引用
小括号'()'的作用：

* **分组**: 把单独项组合成子表达式统一处理，一般用于`？、+、*、{n,m}`等的重复处理
* **向后引用**: 即在正则表达式中用 `\n` （n代表引用的序号数组）引用式中前面括号中匹配的文本
* **子模式匹配**: 有时我们想直接引用操作括号匹配的本文，那么可以用子模式匹配的功能。基本形式是用 `$n` 的形式替代匹配编号为n的文本，常用在String对象里的replace()方法

### RegExp 对象属性

|---
| 属性 | 描述
|-|:-|:-:|-:
|global | RegExp 对象是否具有标志 g。
|ignoreCase | RegExp 对象是否具有标志 i。
|lastIndex | 一个整数，标示开始下一次匹配的字符位置。
|multiline | RegExp 对象是否具有标志 m。
|source | 正则表达式的源文本。

### RegExp 对象方法

|---
| 方法 | 描述
|-|:-|:-:|-:
|compile | 编译正则表达式。
|exec | 检索字符串中指定的值。返回找到的值，并确定其位置。
|test | 检索字符串中指定的值。返回 true 或 false。


## 正则表达式配合String方法的使用

### search


### match
匹配模式：“3个数字，1个单词，1个任意的字符，2个数字或者字符串N/A，1个空格，然后重复第一个单词”
{% highlight javascript %}
var s = '123abc0N/A abc';
s.match(/\d{3}([a-z]+).(\d{2}|N\/A)\s\1/);

// 输出总匹配串和两个分组
// ["123abc0N/A abc", "abc", "N/A"]
{% endhighlight %}

### replace

### split