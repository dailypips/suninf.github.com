---
layout: article
title: Python之生成器
category: python
description: python中迭代是一种重要的方式，使得代码简洁，再加上列表解析等，大大增强迭代对应的表达语义。
---
*python中迭代是一种重要的方式，使得代码简洁，再加上列表解析等，大大增强迭代对应的表达语义。*
 
然而自己手动写迭代器并非很简洁，需要定义类，定义`__iter__()`以及`next()`方法，而生成器的产生正式基于对语义简化表达的优化。
 
## 生成器

在语法上，生成器很像一个带yield语句的函数，不过与普通函数不同的是，生成器可以通过yield语句暂停执行并返回中间结果，当下次调用next()时，会从前一次离开的地方继续执行。
 
### yield表达式语法：

~~~
yield_atom           ::=  "(" yield_expression ")"
yield_expression     ::=  "yield" [expression_list]
expression_list      ::=  expression_r( "," expression )* [","]
~~~

注：

1. 生成器执行过程中，主动执行的yield表达式（yield_atom），除了向外界返回expression_list外，yield_atom本身也有返回值，默认为None。
2. 当通过gen.send(value)向生成器发送数据时，value将成为yield表达式本身的返回值。
 
### 生成器方法：

* gen.next()  
用于启动生成器或者从生成器上次挂起的地方恢复，继续执行至下一个yield语句，此时，生成器挂起，expression_list对应的值返回给调用者；如果next()调用后，生成器结束且没有调用yield语句，则抛出StopIteration异常。
 
next()方法使得生成器可以用于for x in gen来迭代。
 
例1，随机从列表中弹出元素：

{% highlight python %}
def random_pop( List ):
    import random
    while len(List) > 0:
        yield List.pop( random.randint( 0, len(List)-1 ) )
 
>>> [ x for x in random_pop( range(10) ) ]
[1, 3, 6, 9, 4, 8, 0, 5, 7, 2]
{% endhighlight %}
 
例2，无限的Fibonacci序列：  

{% highlight python %}
def fibonacci():
    a, b = 0, 1
    while True:
        yield b
        a, b = b, a + b
 
>>> fib = fibonacci()
>>> [ fib.next() for x in range(10) ]
[1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
{% endhighlight %}
 
* gen.send(value)  
重新继续生成器的执行，并且设置当前的yield表达式的值为value，生成器内部可以接收该值，且send()将继续执行直到产生下一条yield语句或者生成器结束抛出StopIteration异常。

如果调用send()来启动生成器，参与需要为None，因为当前没有可以接受该值的yield语句。
 
例如：

{% highlight python %}
def counter():
    count = 0
    while True:
        val = (yield count)      # send()设置值val，否则val为None
        if val is not None:
            count = val
        else:
            count += 1
 
>>> cnt = counter()
>>> cnt.next()
0
>>> cnt.next()
1
>>> cnt.send(10)
10
>>> cnt.next()
11
{% endhighlight %}
 
* gen.throw(type[, value[, traceback]])  
从上次暂停的yield语句处抛出type类型的异常，并继续执行返回下一个yield语句产生的值或者生成器结束抛出StopIteration异常。
 
 
* gen.close()  
强制结束生成器。可以使用finally来处理未被捕获的close或throw调用，以完成清理工作。
 
例如：

{% highlight python %}
def echo( value ):
    print u'start'
    try:
        while True:
            try:
                value = (yield value)   
            except Exception, e:
                value = e
    finally:
        print u'clean up'
 
>>> gen = echo(5)
>>> print gen.next()
start
5
>>> print gen.next()
None
>>> print gen.send(10)
10
>>> gen.throw( TypeError, u'spam' )
TypeError(u'spam',)
>>> gen.close()
clean up
{% endhighlight %}
 
## 生成器表达式

* 为了更简洁的定义生成器，python增加了生成器表达式，使用了与列表解析几乎相同的语法，不过使用的是小括号而不是中括号。
* 生成器表达式返回的是一个生成器，在后续迭代中才计算，所以是按需计算；而列表解析是直接返回列表，完成所有的计算，并且列表大时会占用很大的内存。
 
在语法上：

* 列表解析：      `[ expr for iter_var in iterable if cond_expr ]`
* 生成器表达式：  `( expr for iter_var in iterable if cond_expr )`
 
生成器表达式是可迭代的对象，并且是缓式计算，是优化版的列表解析。

例如：

{% highlight python %}
>>> max( len(x) for x in ['sjw', 'suninf'] )
6
 
>>> [ x for x in ( y**2 for y in range(5) ) ]
[0, 1, 4, 9, 16]
{% endhighlight %}