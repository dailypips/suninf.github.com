---
layout: article
title: Python之内建类型与函数
category: python
---
*python内建的类型：数值类型，序列，字典，文件，自定义类型，实例，异常等。*
 
### 判断为False的条件  

None  
False  
数值类型的值为0的，如：`0，0L，0.0`等  
空的序列，如：`''，()，[]`  
空的map，如：{}  
自定义类型的实例，如果类型定义了__nonzero__()或__len__()方法，并且方法返回0或False  
 
 
### Boolean操作

或：x or y  
并：x and y  
非：not x  
 
 
### 比较操作

大小：`<、<=、>、>=、==、!=`  
对象等价性：`is、is not`，即x is y 等价于 id(x) == id(y)
 
 
### 位操作

或：`x | y`  
异或：`x ^ y`  
并：`x & y`  
非：`~x`  
左移：`x << n`  
右移：`x >> n`  
 
 
### 迭代(Iterator)类型

python提供了容器的迭代器的概念，要成为迭代类型，总体上需要实现2个方法以支持迭代器的概念。
 
1. 自定义类型需要定义__iter__()方法，返回一个iterator迭代对象。（迭代对象常常可以是自身，这样只需要再定义next()即可）
2. `__iter__()`返回的对象要求支持两个函数：
    - `iterator.__iter__()`：返回迭代器对象自身；
    - `iterator.next()`：返回集合的下一项，没有更多项时，需要抛出StopIteration异常。
 
例如：
{% highlight python %}
# vector自定义类型
class vector(object):
    def __init__(self, N, val):
        self.list = [val] * N
        self.pos = 0
 
    def __iter__(self):
        return self
 
    def next( self ):
        if self.pos >= len( self.list ):
            raise StopIteration
        else:
            val = self.list[ self.pos ]
            self.pos += 1
            return val
       
    def push_back(self, val):
        self.list.append(val)
 
# 测试：
v = vector( 3, 5 )
v.push_back(8)
for i in v:
    print i
 
# 输出：
# 5
# 5
# 5
# 8
{% endhighlight %}
 
### 其他内建类型如字符串、列表、字典等
 
 
### 内建函数

内建函数的官方文档：[http://docs.python.org/library/functions.html](http://docs.python.org/library/functions.html)
 
- abs( x )  
绝对值
 
- divmod( a, b )  
对于整型，等价于 `(a // b, a % b)`  
 
- all(iterable)  
如果可迭代对象iterable的所有元素都为True，则返回True，否则False
 
- any(iterable)  
可迭代对象iterable的任何一个元素 为True，则返回True
 
- `bin(x) & hex(x) & oct(x)`  
返回整数x的对应进制表示的字符串
 
- bool([x])  
按照python类型的bool判断方式，初始化一个bool值，不提供参数时为False
 
- bytearray([source[, encoding[, errors]]])  
生成字节数组，字节数组是可变的整数序列，可以使用列表的大部分操作，整数大小范围是0 <= x < 256。  
source：  
如果是Unicode字符串，需要encoding指定编码；  
如果是可迭代对象，则对应的元素需要是[0,256)内的整数  
如果输数字，则初始化为该长度的0  
 
- callable( object )  
判断参数是否可调用。  
函数、类等都是可调用的。类实例如果具有__call__()方法，则也是可调用的。
 
- chr( i )  
返回整数i对应的ASCII字符。参数i范围[0,255]
 
- unichr( i )  
返回整数i对应的Unicode字符。参数i范围[0,0x10ffff]
 
- ord( c )  
c是单字符，支持8字节或Unicode，返回字符对应的整数值
 
- classmethod(function)  
为函数返回一个类方法，装饰器惯用法：  

~~~
class C:
    @classmethod
    def f(cls, arg1, arg2, ...): ...
~~~

- staticmethod(function)  
为函数返回一个静态方法，装饰器惯用法：  

~~~
class C:
    @staticmethod
    def f(arg1, arg2, ...): ...
~~~

- cmp(x, y)  
比较两个值x和y的大小，`x<y`返回负数，x==y返回0，`x>y`返回正数  
 
- compile(source, filename, mode[, flags[, dont_inherit]])  
编译出可执行对象
 
- eval_r(expression[, globals[, locals]])  
直接计算python的字符串表达式。表达式中的变量默认从全局和局部作用域中取。
 
- execfile(filename[, globals[, locals]])  
读取文件并执行
 
- complex([real[, imag]])  
构造复数
 
- `delattr(object, name) & setattr(object, name, value)`  
删除和设置对象属性
 
- `dict( [arg] )，list([iterable])，set([iterable])，tuple([iterable])`  
 
- `dir( [object] ) & vars([object])`  
不带参数，将返回当前局部作用域的可用名字  
带参数，则返回对象相关的属性，其中vars为对象的成员变量属性map
 
- `enumerate(sequence, start=0)`
返回一个枚举对象，迭代访问时，每一项对应(count, value)对的形式。  
等价于：  
{% highlight python %}
def enumerate(sequence, start=0):
    n = start
    for elem in sequence:
        yield n, elem
        n += 1
{% endhighlight %}
        
例如：  
{% highlight python %}
>>> list( enumerate( ['zhenshan', 'suninf007'] ) )
[(0, 'zhenshan'), (1, 'suninf007')]
{% endhighlight %}

- `file(filename[, mode[, bufsize]]) & open(name[,mode[,buffering]])`  
指定方式打开文件句柄。
 
- frozenset([iterable])  
构造不可变集合
 
- getattr(object, name[, default])  
获取对象的属性，getattr(x, 'foobar') 等价于x.foobar
 
- `globals() & locals()`  
全局 `&` 局部符号表
 
- hasattr(object, name)  
是否有对应的属性
 
- hash( [object] )  
对象的hash值
 
- id(object)  
对象的标识，可以理解为对象存储的内存地址
 
- int([x[, base]]) long([x[, base]])
 
- isinstance(object, classinfo)  
对象是否是类型的一个实例
 
- issubclass(class, classinfo)
 
- len(s)
 
- `max(iterable[, args...][key]) & min(iterable[, args...][key])`  
选择序列的最大最小值，可以带参数key = func来加以函数运算
 
- pow(x, y[, z])  
等价于 (x**y) % z，但是更高效
 
- `range([start], stop[, step]) & xrange([start], stop[, step])`  
range返回列表，xrange返回生成器，对大列表不会占用大量内存
 
- reversed(seq)  
返回序列的逆向迭代器，可用于常用序列
 
- sorted(iterable[, cmp[, key[, reverse]]])  
返回已序的列表
 
- sum(iterable[, start])  
累加
 
- super(type[, object-or-type])  
代理调用基类方法
 
- type(object)
 
- unicode([object[, encoding[, errors]]])  
构造unicode串
 
- zip([iterable, ...])  
折叠，如：  
{% highlight python %}
>>> x = [1, 2, 3]
>>> y = [4, 5, 6]
>>> zip(x, y)
[(1, 4), (2, 5), (3, 6)]
{% endhighlight %}

- apply(function, args[, keywords])  
函数参数应用来调用，等价于function(*args, **keywords)。