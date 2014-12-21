---
layout: article
title: Array in javascript
category: javascript
---
数组是值的有序集合，Javascript数组是无类型的，数组元素可以是任意类型，并且同一数组中的不同元素也可以是不同类型。

## 创建数组

* 数组直接量  
`var ary = [1, 'hello', {x:1}, [2,3,5]];`

* 使用Array()的构造函数
{% highlight javascript %}
var a = new Array();
var b = new Array(10); // 指定数组长度
var c = new Array(2,3,5,'hello'); // 指定数组元素
{% endhighlight %}


## 数组元素的读写
数组是对象的特殊形式，使用方括号[]和数字索引访问数组元素：

* JavaScript会将指定的数字索引值转换成字符串（索引值1变成"1"），然后将其作为属性名使用。
* 常规对象其实也可以使用数字下标，如：`var o = {}; o[1] = 'one';`
* 数组的特别之处在于，当使用小于2^32的非负整数作为属性名时，数组会自动维护**length属性**值。
* 所有的数字索引都是属性名，但时只有0～2^32-2之间的整数属性名才是索引。
* 所有的数组都是对象，可以为其创建任意名字的属性，比如负整数或非整数作为数组属性名时会转成字符串属性名。

## 数组长度

### 读取length属性
{% highlight javascript %}
[].length // 0
[1,2,3].length // 3
{% endhighlight %}

### 设置length属性

* 设置length属性为小于当前长度的非负整数n时，当前数组中索引值大于等于n的元素将从中删除
* 设置大于当前长度的值时，不会添加元素，只是会在数组尾部创建空的区域以备使用


### 数组元素的添加与删除

* 添加元素：
    1. 为新索引赋值 `var a = []; a[0] = "zero";`
    2. push()方法在尾部添加1个或多个元素 `a.push("one", "two");`
    3. unshift()方法在数组首部插入一个元素
* 删除元素：
    1. delete运算符，如`a = [1,2,3]; delete a[1];`，则`1 in a`为false，删除指定索引的元素，但是数组的length属性不会变，并且数组变成了**稀疏数组**。
    2. pop()和shift()分别在数组尾部和首部删除元素


## 遍历数组

* 一般用索引直接用for循环遍历数组
* 不能直接用for/in遍历数组，原因时会枚举Array.prototype中的方法，除非做好过滤
* forEach()方法

{% highlight javascript %}
var data = [1,2,3,4,5];
var sum = 0;
data.forEach( function(x){
    sum += x;
});
sum // 15
{% endhighlight %}

## 数组方法

### join() 

* 将数组中的所有元素都转化为字符串并连接在一起
* 可以指定分隔符来分割，默认是逗号

{% highlight javascript %}
var a = [1,2,3];
a.join(" ");// "1 2 3"
Array(5).join('-'); // "-----"
{% endhighlight %}

### reverse()
将数组中的元素颠倒顺序。

### sort()
将数组中的元素排序，并返回排序后的数组。

* 不带参数的版本使用字母序
* 可以使用谓词函数来对数组参数排序

{% highlight javascript %}
var a = [3,2,1,4];
a.sort(function(x,y){
    return x < y;
});
a // [4,3,2,1]
{% endhighlight %}

### concat()
返回一个新数组，元素包括原数组以及contact的每个参数：

* 如果concat参数中包含数组，那么连接的是数组的元素，而不是该数组本身
* 但concat也不会递归扁平化数组的数组
* 原始数组不会修改

### slice()
`slice(start [, end])`  
返回一个新的数组，包含从 start 到 end （不包括该元素）的 arrayObject 中的元素。

### splice()
`arrayObject.splice(index,howmany,item1,.....,itemX)`

* splice() 方法可删除从 index 处开始的零个或多个元素，并且用参数列表中声明的一个或多个值来替换那些被删除的元素。
* 如果从 arrayObject 中删除了元素，则返回的是含有被删除的元素的数组。

{% highlight javascript %}
var a = [1,2,3,4,5];
a.splice(2,3); // 返回[3,4,5], a为[1,2]
{% endhighlight %}

### push()、pop()、unshift()、shift()

### forEach()
`array.forEach(callback[, thisArg])`  
callback: 函数会被依次传入三个参数: 元素值, 元素索引, 被遍历的数组对象本身  
thisArg: 在执行callback函数时指定的this值

{% highlight javascript %}
var result = {
    val : 0,
    fold : function( x, idx, array ){
        this.val += x;
    }
}

var a = [1,2,3,4,5];
a.forEach( result.fold, result );
result.val // 15
{% endhighlight %}

### map()
`arr.map(callback[, thisArg])`  
将数组的每个元素传递给指定的函数，并返回一个数组，它包含该函数的返回值。  
`[1,2,3].map( function(x) { return x*x; } ); // [1,4,9]`

### filter()
返回的数组元素是调用数组的一个子集，传递的函数用来逻辑判断，为true的元素会成为子集的元素。

### every() 和 some()
所有元素都满足和只要有一个满足条件的算法。

### reduce() 和 reduceRight()
`arr.reduce(callback,[initialValue])`  
当不提供初始值时，会使用数组的第一个元素。  

{% highlight javascript %}
var a = [1,2,3,4,5];
var product = a.reduce( function(x,y) {return x*y;}, 1 ); // 120
var max = a.reduce( function(x,y) {return x>y?x:y;} ); // 5
{% endhighlight %}

### indexOf() 和 lastIndexOf()
搜索指定值的第一个索引，没找到返回－1



