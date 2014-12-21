---
layout: article
title: Python之Unicode编码
category: python
---
Unicode编码是通用的宽字节编码，通常情况我们都只要直接使用Unicode编码即可，这样可以保证代码的通用。  

然而，Unicode宽字节，稍微有些浪费，对于每个单字节可以表示的ASCII编码也是有双字节，因而在网络通信中为节省带宽，常常不是直接使用unicode，而是使用utf-8，gbk等紧凑的编码方式。

## 编码转换的通用流程是：

1. 应用中应该直接使用Unicode；
2. 需要网络传输时从Unicode转化（encoding）为指定编码（如utf-8）再传输；
3. 接收端接收到的字节流按照约定的编码（如utf-8）再转化（decoding）为Unicode使用
 
### 一些功能函数：
 
- Unicode是python的内建类型，unicode字符串字面值是通常字符串前加上`u / U`字符，如：`u'中国'`；还支持`r / R`原始字符串，如：`ur'C:\Python27'` 表示 `u'C:\\Python27'`
- `unicode( string [, encoding, errors ] )` 内建函数可以将8字节的字符串按照指定编码解码为Unicode，encoding默认为ASCII。
- unicode类型的`u.encode( [encoding, errors='strict'] )`方法，能将unicode类型按照指定编码转化为8字节字符串；（errors参数还可以为：`'ignore', 'replace'`）
- 8字节字符串类型的`a.decode( [encoding, errors] )`方法，将8字节字符串按照指定编码转化为unicode字符串
 
例如：
{% highlight python %}
# chinese.py
# This Python file uses the following encoding: utf-8
str = u'中国'
print type(str)
print str
 
# utf-8
str_utf_8 = str.encode( 'utf-8' )
print str_utf_8
 
# unicode
str_u = unicode( str_utf_8, 'utf-8' )
str_u2 = str_utf_8.decode( 'utf-8' )
print str_u
print str_u2
 
# 输出：
# <type 'unicode'>
# 中国
# 中国
# 中国
# 中国
{% endhighlight %}

注：
python模块（.py文件）中直接使用Unicode才能表示的字符（如中文）时，需要在文件上指定编码，否则print会打印乱码。py文件顶部指定编码，比如：  
`# This Python file uses the following encoding: utf-8`
 
 
### unicode类型与普通字符串类型一样，也有大量的方法可以使用，例如：
{% highlight python %}
# This Python file uses the following encoding: utf-8
str = u'中国人'
print str.count(u'人')
print str.find(u'人')
print str.replace( u'人', u'心' )
 
# 输出：
# 1
# 2
# 中国心
{% endhighlight %}

注意：

- 程序中尽量直接使用unicode字符串，字面值前加上u；
- 不要使用str()函数，而应该使用uncode()内建函数；
- int()内建函数可以将纯数字的unicode字符串（如：`u'123'`）转型为int；
- 不要使用过时的string模块 
 