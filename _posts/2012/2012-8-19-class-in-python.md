---
layout: article
title: Python之面向对象编程
category: python
---
本文介绍python的面向对象编程。

## 类型定义和构造函数

使用`class`关键字，基类默认使用object，构造函数是特殊的`__init__( self, arg… )`方法，例如：

{% highlight python %}
class myclass(object):
    def __init__(self, n):
        self.val = n
       
    def display(self):
        print self.val
       
>>> t = myclass(3)
>>> t.display()
3
{% endhighlight %}
 
 
## 继承体系与super关键字

派生类调用基类的方法时，使用super来辅助完成。

{% highlight python %}
class AddrBookEntry(object):
    def __init__(self, nm, ph):
        self.name = nm
        self.phone = ph
       
    def update(self, new_nm, new_ph):
        self.name = new_nm
        self.phone = new_ph
       
    def display(self):
        print 'addr_book_entry: %s %d' % ( self.name, self.phone )
       
class EmplAddrBookEntry( AddrBookEntry ):
    def __init__(self, nm, ph, em):
        super( EmplAddrBookEntry, self ).__init__( nm, ph )
        self.email = em
   
    # 覆盖函数
    def update(self, new_nm, new_ph, new_em):
        super(EmplAddrBookEntry, self).update( new_nm, new_ph )
        self.email = new_em
   
    def display(self):
        super(EmplAddrBookEntry, self).display()
        print 'email: %s' % self.email
 
# 测试
addrentry = AddrBookEntry( 'sjw', 12345 )
addrentry.display()
 
empl_addrentry = EmplAddrBookEntry( 'zhenshan', 23456, 'zhenshan@163.com' )
empl_addrentry.update('suninf', empl_addrentry.phone, empl_addrentry.email)
empl_addrentry.display()
 
# 输出：
addr_book_entry: sjw 12345
addr_book_entry: suninf 23456
email: zhenshan@163.com
{% endhighlight %}

注：  
派生类覆盖了基类的`__init__()`方法时，基类的`__init__()`方法不会自动调用，需要显式通过`super(Derived, self).__init__()`调用基类的__init__()方法。
 
 
## 关于静态方法与类方法

两者都是类级别的方法，区别仅在于类方法第一个参数是类对象（而类成员方法的第一个参数是类实例）；静态方法的参数不包括类对象。
 
{% highlight python %}
class ClassMethod(object):
    def __init__(self, nm):
        self.name = nm
   
    @staticmethod
    def static_foo(val):
        print 'call staticmethod'
        print val
   
    @classmethod
    def class_foo(cls, val):
        print 'call classmethod with class: %s' % cls.__name__
        print val
 
 
ClassMethod.static_foo(5)
ClassMethod.class_foo(10)
 
# 输出：
call staticmethod
5
call classmethod with class: ClassMethod
10
{% endhighlight %}
 
## 关于定制类

python类提供了大量的可以定制的操作符，只要类定义实现相应的方法，就能使用相应的操作符。

例如（模拟C++的cout与`operator<<`）：

{% highlight python %}
class CppFile(object):
    def __init__(self, fp):
        self.fp = fp
   
    def __lshift__(self, obj):
        self.fp.write( str(obj) )
        return self
   
import sys
cout = CppFile( sys.stdout )
cout << 'hello ' << 'world\n'
 
# 输出：
hello world
{% endhighlight %}

## 类型包装

- 继承并包装内建类型

{% highlight python %}
class folder(list):
    def __init__(self, name):
        self.name = name
   
    def dir(self):
        print 'folder "%s" with following files:' % self.name
        for x in self:
            print x
 
fd = folder('doc')
fd.append( 'music' )
fd.append( 'pic' )
fd.dir()
 
# 输出：
folder "doc" with following files:
music
pic
{% endhighlight %}
 

- 通过`__getattr__()` 包装转发属性查询

{% highlight python %}
class Wrap(object):
    def __init__(self, obj):
        self._obj = obj
   
    def __str__(self):
        return str( self._obj )
   
    __repr__ = __str__
   
    def __getitem__(self, idx):
        return self._obj[idx]
   
    def __getattr__(self, attr):
        return getattr( self._obj, attr )
 
 
L = Wrap( [1,'sjw'] )
L.append( 'suninf' )
print L
print L[1]
 
# 输出：
[1, 'sjw', 'suninf']
sjw
{% endhighlight %}

注：

- Wrap实例L.append()调用时，未查询到的属性append由`__getattr__()`方法控制，转发到对成员`_obj`的属性查询
- `__getitem__(self, idx)`对应类型的下标操作
