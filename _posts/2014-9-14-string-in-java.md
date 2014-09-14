---
layout: article
title: String in java
category: java
description: 本文介绍java的字符串及其编码转换
---
*本文介绍java的字符串及其编码转换。*

## String

### 基本用法

String是常量字符串，正因为是常量使得String对象可以安全的在变量间分享。

例如：  
{% highlight java %}
String a = "hello";
a += " world";	// 相当于把a指向a+“ world”得到的常量字符串
String b = a; 	// 共享a指向的常量字符串
{% endhighlight %}

### 构造函数

- `String(char[] value)`  
分配一个新的 String，使其表示字符数组参数中当前包含的字符序列。 

- `String(char[] value, int offset, int count)`  
分配一个新的 String，它包含取自字符数组参数一个子数组的字符。 

- `String(String original)`  
初始化一个新创建的 String 对象，使其表示一个与参数相同的字符序列；换句话说，新创建的字符串是该参数字符串的副本。 

- `String(StringBuffer buffer)`  
分配一个新的字符串，它包含字符串缓冲区参数中当前包含的字符序列。 

- `String(StringBuilder builder)`  
分配一个新的字符串，它包含字符串生成器参数中当前包含的字符序列。


### Unicode与uft-8, gbk等之间编码转换

Java的String是unicode编码，而网络传输一般是带编码的utf-8,gbk格式的字节流。

String与utf-8的编码转换：  
{% highlight java %}
String org = "中国happy";
try {
	// unicode to utf-8
	byte[] bytes = org.getBytes( "utf-8" );
	
	// utf-8 to unicode
	String newString = new String(bytes, "utf-8");

} 
catch (UnsupportedEncodingException e) {
}
{% endhighlight %}

如果是转换为gbk编码，只要上面的参数改为”gbk”即可。


### 常用方法

- `char charAt(int index)`   
返回指定索引处的 char 值。   

- `int compareTo(String anotherString)`   
按字典顺序比较两个字符串。   

- `int compareToIgnoreCase(String str)`   
按字典顺序比较两个字符串，不考虑大小写。   

- `String concat(String str)`   
将指定字符串连接到此字符串的结尾。   

- `boolean contains(CharSequence s)`   
当且仅当此字符串包含指定的 char 值序列时，返回 true。   

- `boolean contentEquals(CharSequence cs)`   
将此字符串与指定的 CharSequence 比较。   

- `boolean endsWith(String suffix)`   
测试此字符串是否以指定的后缀结束。   

- `int hashCode()`   
返回此字符串的哈希码。   

- `int indexOf(int ch)`  
返回指定字符在此字符串中第一次出现处的索引。   
- `int indexOf(int ch, int fromIndex)`   
返回在此字符串中第一次出现指定字符处的索引，从指定的索引开始搜索。   
- `int indexOf(String str)`   
返回指定子字符串在此字符串中第一次出现处的索引。   
- `int indexOf(String str, int fromIndex)`     
返回指定子字符串在此字符串中第一次出现处的索引，从指定的索引开始。   

- `int lastIndexOf(int ch)`   
返回指定字符在此字符串中最后一次出现处的索引。   
- `int lastIndexOf(int ch, int fromIndex)`   
返回指定字符在此字符串中最后一次出现处的索引，从指定的索引处开始进行反向搜索。   
- `int lastIndexOf(String str)`  
返回指定子字符串在此字符串中最右边出现处的索引。   
- `int lastIndexOf(String str, int fromIndex)`   
返回指定子字符串在此字符串中最后一次出现处的索引，从指定的索引开始反向搜索。   

- `boolean isEmpty()`  
当且仅当 length() 为 0 时返回 true。   

- `int length()`  
返回此字符串的长度。   

- `boolean matches(String regex)`  
告知此字符串是否匹配给定的正则表达式。   

- `String replace(char oldChar, char newChar)`  
返回一个新的字符串，它是通过用 newChar 替换此字符串中出现的所有 oldChar 得到的。   
- `String replace(CharSequence target, CharSequence replacement)`   
使用指定的字面值替换序列替换此字符串所有匹配字面值目标序列的子字符串。   

- `String replaceAll(String regex, String replacement)`  
使用给定的 replacement 替换此字符串所有匹配给定的正则表达式的子字符串。   

- `String replaceFirst(String regex, String replacement)`  
使用给定的 replacement 替换此字符串匹配给定的正则表达式的第一个子字符串。   

- `boolean startsWith(String prefix)`  
测试此字符串是否以指定的前缀开始。   
- `boolean startsWith(String prefix, int toffset)`   
测试此字符串从指定索引开始的子字符串是否以指定前缀开始。   

- `CharSequence subSequence(int beginIndex, int endIndex)`  
返回一个新的字符序列，它是此序列的一个子序列。   

- `String substring(int beginIndex)`  
返回一个新的字符串，它是此字符串的一个子字符串。   
- `String substring(int beginIndex, int endIndex)`   
返回一个新字符串，它是此字符串的一个子字符串。   

- `char[] toCharArray()`  
将此字符串转换为一个新的字符数组。   

- `String toLowerCase()`   
使用默认语言环境的规则将此 String 中的所有字符都转换为小写。   

- `String toUpperCase()`  
使用默认语言环境的规则将此 String 中的所有字符都转换为大写。   

- `String trim()`  
返回字符串的副本，忽略前导空白和尾部空白。   

### 静态方法

`static String format(String format, Object... args)`   
使用指定的格式字符串和参数返回一个格式化字符串。   

{% highlight java %}
static String valueOf(char c) 
static String valueOf(char[] data) 
static String valueOf(char[] data, int offset, int count) 
static String valueOf(double d) 
{% endhighlight %}


## StringBuffer

线程安全的可变字符序列。

- StringBuffer 上的主要操作是 append 和 insert 方法。
- append 方法始终将这些字符添加到缓冲区的末端；
- 而 insert 方法则在指定的点添加字符。 


## StringBuilder

一个可变的字符序列。

- 此类提供一个与 StringBuffer 兼容的 API，但不保证同步。如果可能，建议优先采用该类，因为在大多数实现中，它比 StringBuffer 要快。 
- 将 StringBuilder 的实例用于多个线程是不安全的。如果需要这样的同步，则建议使用 StringBuffer。 

