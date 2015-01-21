---
layout: article
title: Python之列表解析
category: python
---
列表解析（List Comprehensions）是针对列表的操作语法，使得处理列表的表达能力大大提升。

## python中列表解析的基本语法

`[ expr for iter_var in iterable if cond_expr ]`
 
注：

- expr对应列表的每一项元素的任意表达式，返回每一次表达式计算值的列表
- iter_var是可迭代对象iterable的迭代变量
- 可以有多个并列的for迭代语句（`for iter_var in iterable`）
- 有可选的if 判断
 

## 一些代表性的例子：
 
1、一列表元素的平方

{% highlight python %}
>>> [x**2 for x in range(10) if not x%2 ]
[0, 4, 16, 36, 64]
{% endhighlight %}
 
2、并列的for迭代语句

{% highlight python %}
>>> [(x, y) for x in [1,2,3] for y in [3,1,4] if x != y]
[(1, 3), (1, 4), (2, 3), (2, 1), (2, 4), (3, 1), (3, 4)]
{% endhighlight %}


3、可以嵌套：外层表达式expr本身也是列表解析表达式

{% highlight python %}
>>> matrix = [ [1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12] ]
>>> [[row[i] for row in matrix] for i in range(4)]
[[1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12]]
{% endhighlight %}
 
4、并列的迭代语句，迭代变量可以依赖

{% highlight python %}
>>> for e in [ (x,y) for x in range(5) for y in range(x) ]:
        print e
(1, 0)
(2, 0)
(2, 1)
(3, 0)
(3, 1)
(3, 2)
(4, 0)
(4, 1)
(4, 2)
(4, 3)
{% endhighlight %}

5、对于iterable为元组列表的，支持两种通用的for语法

{% highlight python %}
>>> seq = ['one', 'two', 'three']
>>> [ x for x in enumerate(seq) ]
[(0, 'one'), (1, 'two'), (2, 'three')]
{% endhighlight %}

或：

{% highlight python %}
>>> [ (i,v) for i,v in enumerate(seq) ]
[(0, 'one'), (1, 'two'), (2, 'three')]
{% endhighlight %}