---
layout: article
title: Python之函数式编程
category: python
description: 本文介绍python中函数式编程的一些细节。
---
*本文介绍python中函数式编程的一些细节。*

## 函数参数

### 默认参数

python的默认参数使用与C++一致的语法：

- 语法表达：def_arg = def_val
- 所有的位置参数必须在任何一个默认参数之前
 
默认参数常常用于定义函数的默认行为，例如：

{% highlight python %}
def tax_cost( cost, rate = 0.1 ):
    return cost * rate
 
>>> tax_cost(100)
10.0
>>> tax_cost(100, 0.5)
50.0
{% endhighlight %}
 
### 命名参数(keyword arguments)

python函数支持命名参数，这使得python函数定义时的签名很重要，因为参数名可以用于命名参数来调用函数；这点与C++不同，C++不支持命名参数，只与位置有关。
命名参数使得函数调用通过参数名来指定，并且以依赖于函数签名中参数位置。
 
用上面例子：

{% highlight python %}
>>> tax_cost( rate=0.3, cost=50 )
15.0
{% endhighlight %}
 
### 变长参数（模式匹配）

python支持两种变长参数语法：变长参数（tuple）与命名变长参数（dict）。
 
(1)、变长参数（tuple）  

~~~
def func( [formal_args,] *vargs_tuple ):
    func_body
~~~

`*`号操作符参数vargs_tuple将作为元组传递给函数，元组保存了所有传递给函数的额外的参数（匹配了所有位置和命名参数后剩余的）。
 
(2)、命名变长参数（dict）  

~~~
def func( [formal_args,] [*vargs_tuple,] **vargs_dict ):
    func_body
~~~

`**`双星号操作符参数vargs_dict作为字典传递给函数，匹配了额外的命名参数。
 
例如：

{% highlight python %}
def foo( arg, *args_tuple, **args_dict ):
    print 'arg: ', arg
    print 'args_tuple: ', args_tuple
    print 'args_dict: ', args_dict
 
>>> foo(10, 20, [1,2,3], name='sjw', age=20)
arg:  10
args_tuple:  (20, [1, 2, 3])
args_dict:  {'age': 20, 'name': 'sjw'}
{% endhighlight %}


## lambda匿名函数

语法：  
`lambda [arg1[, arg2 ... argN]] : expression`

1. 表达式的定义体必须和声明放在同一行；
2. 参数支持默认参数与可变参数;
3. 由于有了列表解析等工具，lambda实际中使用并没有很多
 
例子：

{% highlight python %}
>>> [ (lambda x : x*x)(elem) for elem in xrange(5) ]
[0, 1, 4, 9, 16]
 
>>> ( lambda x, y=2 : (x+y, x-y) )(5)
(7, 3)
 
>>> show_as_tuple = lambda *z : z
>>> show_as_tuple( 1, 'sjw' )
(1, 'sjw')
{% endhighlight %}
 

## operator模块

该模块包含了各种运算符对应的函数。

### 比较操作：  
operator.lt(a, b) 等价于  `a < b`  
operator.le(a, b)  
operator.eq(a, b)  
operator.ne(a, b)  
operator.ge(a, b)  
operator.gt(a, b)  

### 逻辑操作  
operator.not_(obj)  
operator.truth(obj)      等价于 bool构造函数  
operator.is_(a, b)       等价于 a is b  
operator.is_not(a, b)
 
### 数学运算  
operator.abs(obj)  
operator.add(a, b)  
operator.div(a, b)  
operator.floordiv(a, b)  
operator.index(a)    等价于 `a.__index__()`，转换为整数  
operator.mod(a, b)       等价于 a % b  
operator.mul(a, b)  
operator.neg(obj)  
operator.pow(a, b)       等价于 a ** b  
operator.sub(a, b)  
operator.truediv(a, b)  
 
### 位运算  
operator.and_(a, b)  
operator.or_(a, b)  
operator.xor(a, b)  
operator.rshift(a, b)  
operator.lshift(a, b)  
operator.inv(obj)        等价于 ~obj  
operator.invert(obj)     等价于 inv
 
### 序列操作  
operator.concat(a, b)  
operator.contains(a, b)  
operator.countOf(a, b)  
operator.delitem(a, b)      等价于 del a[b]  
operator.getitem(a, b)  
operator.indexOf(a, b)  
operator.setitem(a, b, c)  
 
### 属性与项的查询

- `operator.attrgetter(attr[, args...])`

属性名查询：  
若`f = operator.attrgetter('name')`  
则：f(b) 等价于 b.name  
 
若`f = operator.attrgetter(‘name’, ‘date’)`  
则：f(b) 等价于 (b.name, b.date)  
 
等价于：

{% highlight python %}
def attrgetter(*items):
    if len(items) == 1:
        attr = items[0]
        def g(obj):
            return resolve_attr(obj, attr)
    else:
        def g(obj):
            return tuple(resolve_attr(obj, attr) for attr in items)
    return g
 
def resolve_attr(obj, attr):
    for name in attr.split("."):
        obj = getattr(obj, name)
    return obj
{% endhighlight %}
 
- `operator.itemgetter(item[, args...])`

用下标item来获取序列的元素：
 
等价于：

{% highlight python %}
def itemgetter(*items):
    if len(items) == 1:
        item = items[0]
        def g(obj):
            return obj[item]
    else:
        def g(obj):
            return tuple(obj[item] for item in items)
    return g
{% endhighlight %}


例如：

{% highlight python %}
>>> itemgetter(1,3,5)('ABCDEFG')
('B', 'D', 'F')
{% endhighlight %}


- `operator.methodcaller(name[, args...])`

方法查询调用：  
若   f = operator.methodcaller(‘name’)`，  
则 f(b) 等价于 b.name()
 
若`f = operator.methodcaller(‘name’, ‘foo’, bar=1)`，  
则 f(b) 等价于 b.name( ‘foo’, bar=1 )
 
等价于：

{% highlight python %}
def methodcaller(name, *args, **kwargs):
    def caller(obj):
        return getattr(obj, name)(*args, **kwargs)
    return caller
{% endhighlight %}
 
## 偏函数应用functools模块

### `functools.partial(func[,*args][, **keywords])`

应用部分参数，返回可以使用剩下参数调用的函数：
 
等价于：

{% highlight python %}
def partial(func, *args, **keywords):
    def newfunc(*fargs, **fkeywords):
        newkeywords = keywords.copy()
        newkeywords.update(fkeywords)
        return func(*(args + fargs), **newkeywords)
    newfunc.func = func
    newfunc.args = args
    newfunc.keywords = keywords
    return newfunc
{% endhighlight %}

例如：

{% highlight python %}
>>> base2 = partial( int, base=2 )
>>> base2('1101')
13
{% endhighlight %}

 
**注：**  
在函数调用中，可以使用`*tuple`的形式来解开tuple为多个独立参数，还可以使用`**dict`的形式来解开多个字典作为多个参数。例如：

{% highlight python %}
>>> operator.itemgetter( *(1,2,3) )('abcdef')
('b', 'c', 'd')
{% endhighlight %}


## 内部函数与闭包

### 内部函数

python允许在函数体内创建另外一个函数，称内部函数。例如：

{% highlight python %}
def outter(n):
    n += 1
    def inner(x):
        return x*x
   
    return inner(n)
 
>>> outter(9)
100
{% endhighlight %}
 
### 闭包（closure）

内部函数的定义包含了在外部函数中定义的对象的引用，此时内部函数又称为闭包，而由内部函数引用的在外部函数中的对象称为自由变量。例如：

{% highlight python %}
def outter(n):
    n += 1
    def inner(x):
        return x ** n
   
    return inner
 
>>> f = outter(3)
>>> f(2)
16
>>> f(3)
81
{% endhighlight %}

注：  
outer(n)返回一个函数inner，该函数是个闭包，因为inner(x)依赖外部函数outter的自由变量n。
  
## 装饰器（decorators）

装饰器为函数和类型定义一个包装，常用于参数检查、缓存等。
 
### 语法上：

~~~
@dec2
@dec1
def func(arg1, arg2, ...):
    pass
~~~

等价于

~~~
def func(arg1, arg2, ...):
    pass
func = dec2( dec1(func) )
~~~

也可以是带参数的装饰器：

~~~
@dec( argA, argB, ... )
def func(arg1, arg2, ...):
    pass
~~~

等价于

~~~
func = dec(argA,argB,...)(func)
~~~

### 例子

- 不带参数的装饰器：

{% highlight python %}
def mydec( function ):
    def _mydec(*args, **kw):
        print 'before call'
        res = function(*args, **kw);
        print 'after call'
        return res
    return _mydec
 
@mydec
def func():
    print 'hello world'
   
>>> func()
before call
hello world
after call
{% endhighlight %}

- 带参数的装饰器：

{% highlight python %}
def mydec(arg1, arg2):
    def _mydec(function):
        def __mydec(*args, **kw):
            print 'before call', arg1
            res = function(*args, **kw);
            print 'after call', arg2
            return res
        return __mydec
    return _mydec
 
 
@mydec( 'arg1', 'arg2' )
def func():
    print 'hello world'
   
>>> func()
before call arg1
hello world
after call arg2
{% endhighlight %}
 
注：  

- 装饰器可以用于函数或类型；
- python内建一些装饰器，如classmethod、staticmethod等
