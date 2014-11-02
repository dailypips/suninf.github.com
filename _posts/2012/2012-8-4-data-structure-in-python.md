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
 
首先，str字符串包含了以大括号包起来的替换标签`{replacement_field}`，其中**replacement_field 满足一定EBNF语法**：  

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
precision   ::=  integer
type        ::=  "b" | "c" | "d" | "e" | "E" | "f" | "F" | "g" | "G"
                  | "n" | "o" | "s" | "x" | "X" | "%"
~~~

注意：

- 替换标签的名字arg_name可以为数字或者关键字：
    - 如果是数字，则替换依赖于format的参数；
    - 如果是关键字，则替换依赖于命名参数的匹配
- field_name是可选的，当未提供时（仅用"{}"），这时默认是用数字下标0，1，...
- arg_name还支持属性和下标：arg_name.name, arg_name[ element_index ]
- conversion表示替换时的转型：r表示repr(), s表示str()
- format_spec格式控制说明：
    - 可选的fill为填充符
    - `<：左对齐、>：右对齐、^：居中、=：打印首位整数符号`
    - width：区域宽度
    - .precision：对于浮点数的精度
    - type：表示数据展示的方式

详见：[http://docs.python.org/library/string.html#formatspec](http://docs.python.org/library/string.html#formatspec)
 
一些例子：  
{% highlight python %}
>>> u'{:.2f}{}'.format( 3.1415, 'hello world' )
u'3.14hello world'
 
>>> u'{0}{1}{0}'.format(u'abra', u'cad')
u'abracadabra'
 
>>> s = u'{name} likes {sport}.'
>>> s.format( name=u'suninf', sport=u'basket' )
u'suninf likes basket.'
{% endhighlight %}

### 列表（list）

字符串是不可变类型，而列表是可变类型，因而支持更多的改变内容的操作：

|---
|-|:-|:-:|-:
| `s[i] = x` | 替换第i项内容为x
| `s[i:j] = t` | `s[i:j]`的内容被可迭代对象t替换
| `del s[i:j]` | 等价于 `s[i:j] = []`
| `s[i:j:k] = t` | 切片slice由等长的可迭代对象t替换
| `del s[i:j:k]` | 删除s中`s[i:j:k]`对应的元素
| `s.append(x)` | 在列表s中追加项x
| `s.extend(x)` | 将可迭代对象x的项扩展到列表s中
| `s.count(x)` |
| `s.index( x[, i[, j]] )` | 返回`s[i:j]`中第一个等于x的序号，不存在抛出ValueError异常
| `s.insert( i, x )` | 在位置i处插入元素x
| `s.pop( i )` | 删除并返回s[i]
| `s.remove(x)` | 等价于 `del s[s.index(x)]`，可能抛出异常
| `s.reverse()` | 原地逆序
| `s.sort([cmp[,key[,reverse]]])` | 原地排序

注：  

1. 所有操作都是原地操作，改变列表s内容的
2. 对于sort方法：
    - key：是一个转换函数，对原始列表元素进行转换得到新的比较参数
    - cmp：是一个比较函数，比较两个参数的函数
    - reverse：是否逆序
 
一般情况下，尽量用key函数和reverse，因为它们每个元素都只用一次，而cmp函数每次比较都会调用，没必要时尽量用默认的cmp。
 
例如：  
{% highlight python %}
>>> s = [ (2, u'zhenshan'), ( 3, u'sjw' ), ( 1, u'suninf' ) ]
>>> s.sort( key = (lambda x:x[1]) ) # 使用每一项元组的第二个值比较
>>> s
[(3, u'sjw'), (1, u'suninf'), (2, u'zhenshan')]
 
>>> s = [ (2, u'zhenshan'), ( 3, u'sjw' ), ( 1, u'suninf' ) ]
>>> s.sort( lambda x, y: cmp(y,x), key = (lambda x:x[1]) )
>>> s
[(2, u'zhenshan'), (1, u'suninf'), (3, u'sjw')]
{% endhighlight %}

- key函数指定使用元组的第二个元素比较；
- cmp函数指定比较方式`lambda x, y: cmp(y,x)`，即逆序
 
 
### 元组（tuple）

元组支持通用的序列操作,最上面出现的序列通用操作都可用，但是tuple是一种不可变类型，可以用作字典map的key。
 
(1)、元组使用小括号包含的逗号分割序列表示，并且只有一个元素时，后面的逗号不能少。例如：  
{% highlight python %}
>>> t = (1, [2], u'3')
>>> t
(1, [2], u'3')
 
>>> (1,)
(1,)
{% endhighlight %}

(2)、关于tuple不变类型，有个需要特别注意的点：  
虽然元组对象本身不可变，但是元组包含的可变对象还是可以修改的，如：  
{% highlight python %}
>>> t = ( [1,2], 4 )
>>> t[0].append(3)
>>> t
([1, 2, 3], 4)
{% endhighlight %}

(3)、默认集合类型  
所有多对象的、逗号分隔的、没有明确用符号（比如：[], {}等）定义的，这些集合默认的类型都是元组。  
{% highlight python %}
>>> x, y = 1, 2   # 多项同时赋值
>>> x, y = y, x   # 交换复制
>>> x, y          # 是元组
(2, 1)
{% endhighlight %}

同时，函数也返回元组也可以写成默认集合形式：

~~~
def func():
    ...
    return obj1, obj2, ...
~~~

不过，为了清晰起见，还是尽量使用明确的小括号包起来，来表示元组。
 
##  关联容器

### 可变集合set的操作：（python中不可变集合为frozenset）。

|---
| 函数方法 | 等价操作 |  说明
|-|:-|:-:|-:
| `len(s)` | |
| `x in s` | |
| `x not in s` | |
| `s.isdisjoint(t)` | | 集合s和t没有相交元素
| `s.issubset(t)` | `s <= t` | s是t的子集
| | `s < t` | s是t的真子集
| `s.issuperset(t)` | `s >= t` | s是t的超集
| | `s > t` |s真包含t
| `s.union(t,...)` | `s | t | ...` | 并集，返回新的集合
| `s.intersection(t,...)` | `s & t & ...` | 交集
| `s.difference(t,...)` | `s – t - ...` | 差集，s中但不在t中的元素
| `s.symmetric_difference(t)` | `s ^ t` | 对称差集操作，s或t中的元素，但不是s和t共有的元素
| `s.copy()` | | 返回集合的浅拷贝
| 以下仅用于可变集合
| `s.update(t,...)` | `s |= t | ...` | 并集修改s
| `s.intersection_update(t,...)` | `s &= t & ...` | 交集修改s
| `difference_update` | `s -= t | ...` | 差集修改s
| `symmetric_difference_update` | `s ^= t` | 对称差集修改
| `s.add(elem)` | | 集合中增加元素
| `s.remove(elem)` | | 删除元素，如果elem不存在抛出KeyError异常
| `s.discard(elem)` | | 删除元素，不抛异常
| `s.pop()` | | 移除并返回s中的任一元素，为空时，抛出异常
| `s.clear()` | | 清空集合
 
例如：  
{% highlight python %}
>>> s = {1,3,5}
>>> s |= {2,4}
>>> s
set([1, 2, 3, 4, 5])
{% endhighlight %}
 
### 字典（dict或map）  
dict是存储键值对的关联容器。
 
常用方法操作：  

|---
|-|:-|:-:|-:
| `len(d)` | 长度
| `d[key]` | 访问key对应的值，key不存在map中时，抛出KeyError异常
| `d[key] = value` | 新增或更新
| `del d[key]` | 删除key对应的项，若key不存在map中时，抛出KeyError异常
| `key in d` | 
| `key not in d` | 
| `iter(d)` | 返回遍历key的迭代器，等同d.iterkeys()
| d.clear() | 
| `d.copy()` | 浅拷贝
| `d.fromkeys( seq[, value] )` | 以seq列表项为keys创建新字典，d自身不变
| `d.get( key[, default] )` | default默认为None，key存在时返回对应值，否则default
| `d.has_key(key)` | 等价于 key in d
| `d.items()` | 返回(key,value)对的列表
| `d.iteritems()` | items迭代版本，比较高效
| `d.keys()` | key的列表
| `d.iterkeys()` | 
| `d.values()` | value的列表
| `d.itervalues()` |  
| `d.pop( key[, default] )` | 删除并返回key对应的value，如果没有找到，则返回default，若未指定default，则抛出异常
| `d.popitem()` | 删除并返回任意一项（key, value），为空时调用抛出KeyError异常
| `d.setdefault(key[, default])` | 
| `d.update( [other] )` | other为字典或键值对的可迭代对象，用以新增或更新键值对

