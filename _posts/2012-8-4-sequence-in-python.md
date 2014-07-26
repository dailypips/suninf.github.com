---
layout: article
title: Python之数据结构
category: python
description: 基本数据结构是语言中的重要部分，本文介绍python的数据结构：序列和关联容器。
---
*基本数据结构是语言中的重要部分，本文介绍python的数据结构：**序列**和**关联容器**。*

- python的**序列类型**有：string, Unicode string，list，tuple，bytearray，buffer，xrange等，这里介绍Unicode string，list和tuple，另外几个在内建函数中介绍。
- python的**关联容器**有：set，map
  
## 序列数据结构

**所有序列支持的通用操作：**

|---
|-|:-|:-:|-:
| `x in s` | X如果在序列s中，返回True 
| `x not in s` | 
| `s + t` | 序列连接 
| `s * n` | n个s连接起来（注意可变类型是浅拷贝）
| `s[i]` | 第i个元素
| `s[i:j]` | 前闭后开的区间 [i,j)
| `s[i:j:k]` | 步长为k
| `len(s)` | 长度
| `min(s)` | 最小项
| `max(s)` | 最大项
| `s.index(i)` | 元素i出现在s中的位置
| `s.count(i)` | 元素i在s中出现的次数
 
### 字符串（Unicode string）

Unicode string字符串和8字节的string字符串方法基本一致，我们平时使用时一般使用Unicode字符串。
 
下面是一些字符串类型的常用方法：

- `str.count( sub [, start[, end]] )`  
返回`str[start:end]`区间中子串sub出现的次数，区间参数可选
 
- `str.startswith( prefix[, start[, end]] )`  
str[start:end]区间如果以子串prefix开始，则返回True
 
- `str.endswith( suffix[, start[, end]] )`  
str[start:end]区间如果以子串suffix结束，则返回True
 
- `str.find( sub [, start[, end]] )`  
返回子串第一次出现在str[start:end]区间中的位置，-1表示未找到
 
- `str.index( sub [, start[, end]] )`  
与find类似，但是如果未找到，抛出ValueError异常
 
- `str.join( iterable )`  
本身不变，返回以str作为分隔符，将序列iterable中所有元素（字符串表示）合并成一个新的字符串。
 
- `str.isalnum()`  
非空串str内容都为字母或数字
 
- `str.isalpha()`  
非空串str内容都为字母
 
- `str.isdigit()`  
非空串str内容都为数字
 
- `str.islower() & str.isupper()`  
str内容中的字母均为小写或大写，str至少要包含一个字母
 
- `str.lower() & str.upper()`  
返回转为小写或大写拷贝
 
- `str.partition( sep )`  
以子串sep分割str，返回sep之前，sep自身，sep之后组成的3元tuple，如：  
{% highlight python %}
>>> u'suninf007:d'.partition( u':' )
(u'suninf007', u':', u'd')
{% endhighlight %}

- `str.replace( old, new[, count] )`  
将str中的old子串替换为new，指定count则最多替换次数
 
- `str.rfind( sub [, start[, end]] )`  
反向搜索，返回子串最高序号出现在`str[start:end]`区间中的位置，-1表示未找到
 
- `str.rindex( sub [, start[, end]] )`  
与rfind类似，但是如果未找到，抛出ValueError异常
 
- `str.split( [sep[, maxsplit]] )`  
对于带参数的方法，返回子串sep 分割str得到的序列，如果str包含两个连续的sep，则序列会包含一个空串u''  
对于不带参数或者参数为None时，默认使用空白子串作为分割，并且会过滤所有长度的空白子串。
 
- `str.splitlines( [keepends] )`  
以换行符分割，返回各行作为元素的列表，keepends设置为True，则保留换行符
 
- `str.strip( [chars] ) & str.lstrip( [chars] ) & str.rstrip( [chars] )`  
返回str截掉头部和尾部空白字符的子串；参数chars可以指定要移除的字符的集合
 
### 关于字符串格式化

(1)、`%` 格式化语法  

- **元组形式**
与c语言中的格式化类型约定类型，如：  

    - %s 是优先用str()函数进行字符串转换
    - %d 有符号十进制数
    - %f 浮点数
    - %% 打印%字符本身
 
当然还有一些控制指令，可以辅助对其，小数点位数等。
 
例如：  
{% highlight python %}
>>> u'%s %.2f%%' % ( u'rate', 3.14159265 )
u'rate 3.14%'
{% endhighlight %}

- **字典形式**  
python提供了%(var)的方式，以字典的方式来替换，如：
{% highlight python %}
>>> u'there are %(howmany)d %(lang)s quotation symbols.' % \
... { u'lang':u'python', u'howmany':3 }
u'there are 3 python quotation symbols.'
{% endhighlight %}
 
(2)、`$` 字符串模板  
python引入了符号$来支持字符串模板，不需要再像%一样去记忆变量的类型来选择对应的控制符，字符串模板是string模块的Template对象。

- 语法：  

|---
|-|:-|:-:|-:
| `$$` | 表示符号$自身
| `$identifier` | 要求identifier是合法的标识符，在函数substitute()调用时由命名参数来替换
| `${identifier}` | 与`$identifier`等价，如果后面紧跟合法的python标识符时需用
 
string模块对于Unicode字符串来说不应该使用了，不过Template对象还是支持Unicode字符串的，例如：
{% highlight python %}
# template.py
# encoding: utf-8
from string import Template

s = Template( u'$who likes $what' )
print s.substitute( who = u'张三', what = u'python' )
 
# 输出：
# 张三likes python
{% endhighlight %}


(3)、`str.format(*args, **kwargs)`方法  
format方法引入了格式化语法，使得字符串格式化的表达能力大大提高。
 
首先，str字符串包含了以大括号包起来的替换标签`{replacement_field}`，其中replacement_field 满足一定EBNF语法：  

~~~
replacement_field ::=
    "{" [field_name] ["!" conversion] [":" format_spec] "}"
 
field_name ::= arg_name ("." attribute_name | "[" element_index "]")*
 
arg_name ::= [identifier | integer]
 
attribute_name ::= identifier
 
element_index ::= integer | index_string
 
index_string ::= <any source character except "]"> +
 
conversion ::=  "r" | "s"
 
format_spec ::=
    [[fill]align][sign][#][0][width][,][.precision][type]
 
fill        ::=  <a character other than '{' or '}'>
align       ::=  "<" | ">" | "=" | "^"
sign        ::=  "+" | "-" | " "
width       ::=  integer
precision  ::=  integer
type        ::=  "b" | "c" | "d" | "e" | "E" | "f" | "F" | "g" | "G"
                  | "n" | "o" | "s" | "x" | "X" | "%"
~~~

 