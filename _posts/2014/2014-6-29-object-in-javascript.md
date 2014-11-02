---
layout: article
title: Object in javascript
category: javascript
description: 本文介绍Javascript的Object对象类型的重点内容。
---
*本文介绍Javascript的Object对象类型的重点内容。*

## 对象创建

* **对象直接量**  
`var point = { x:0, y:100 };`

* **new关键字**  
`var o = new Object( {v:100} );`  
`var a = new Array([1,2,3]);`

* **原型**  
每个对象都是从**原型**继承属性，通过`{}`和`new Object()`创建的对象都是从`Obejct.prototype`继承。

利用原型继承，可以从现有对象继承来创建新的对象，并且保证新对象的继承属性与原型属性隔离，对属性覆盖不会对原型产生影响。
{% highlight javascript %}
function inherit(p) {
    if(p == null) throw TypeError();
    var t = typeof(p);
    if( t !== "object" && t !== "function" ) {
        throw TypeError();
    }
    
    function f() {};
    f.prototype = p;
    return new f();
}

var o = { x : 'do not change' };
var p = inherit(o); // p: {x:'do not change'}
p.x = 3; // p: {x:3}
o // o: {x:'do not change'}
{% endhighlight %}


## 访问属性

* 对象可以通过`.`号和`[]`来获取属性。
* 但是优先使用 **[]** 来访问属性，因为通过字符串名字来访问可以使程序更加灵活，这种使用，对象就像是关联数组。
{% highlight javascript %}
var obj = { property : 5 };
obj.property
obj['property']
{% endhighlight %}

## 检测属性
检查某个属性是否在对象中，常用：**in运算符**、**hasOwnPorperty()**和**propertyIsEnumerable()**

{% highlight javascript %}
// 扩展或覆盖属性的工具类
function extend(o, p) { 
    for(prop in p) {
        o[prop] = p[prop];
    }
    return o; 
}
{% endhighlight %}

{% highlight javascript %}
var o = { x : 1 };
'x' in o; // true
'toString' in o; // true

o.hasOwnProperty('x'); //true
o.hasOwnProperty('toString'); //false: toString是继承属性
o.propertyIsEnumerable('x'); //true
{% endhighlight %}

注：propertyIsEnumerable()是hasOwnProperty()的增强版本，只有检测到自有属性，并且属性可枚举时才返回true。

## 原型属性
**对象的原型**属性prototype是用来继承属性的，原型属性是在实例对象创建之初就设置好的：

1. 通过直接量创建的对象，原型是Object.prototype
2.使用new创建的对象，使用构造函数的prototype属性作为对象的原型。

**功能函数：**

* `Object.getPrototypeOf(o)`可以查询对象o的原型
* 可以通过`p.isPrototyoeOf(o)`来检测p是否是o的原型
* `Object.getPrototypeOf(o)` 可以查询对象o的原型
* `o.constructor.prototype` 也常用于检测o的原型，但是对于`Object.create(p)`创建的对象，constructor会指代`Object()`构造函数，所以这种情况不适用。

## 对象序列化
对象序列化（serialization）是指将对象的状态转换为字符串，也可将字符串还原为对象。

* 序列化对象：  
`var json_str = JSON.stringify(obj [, null, '\t']); `

* 解析还原对象：  
`var obj = JSON.parse(json_str);`


