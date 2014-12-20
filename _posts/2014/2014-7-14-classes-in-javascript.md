---
layout: article
title: Classes in javascript
category: javascript
---
*在Javascript中，类的实现是基于原型继承来实现的，类的一个重要特征是“动态扩展”（**dynamically extendable**）的能力。这种**动态扩展**和**自省**的能力也是动态脚本语言的强大之处。*


## 原型与工厂函数
工厂函数也是创建对象的一种方式，借助与[inherit](http://www.suninf.net/object-in-javascript/){: target="_blank"}函数可以简单的实现工厂函数。

{% highlight javascript %}
function range(from, to) {
    var r = inherit(range.methods);
    r.from = from;
    r.to = to;
    return r;
}

range.methods = {
    includes : function(x) { 
        return this.from <=x && x <= this.to;
    },
    foreach : function(f) {
        for(var x=Math.ceil(this.from); x<=this.to; x++)
            f(x);
    }
};

// test
var r = range(1,3);
r.includes(2); // true
r.foreach( function(x){console.log(x)} ); // 1 2 3
{% endhighlight %}

## 构造函数
* 使用new关键字来调用构造函数，会自动创建一个新对象，构造函数仅需要初始化这个新对象的状态即可；
* 构造函数的prototype属性将成为新对象的原型

{% highlight javascript %}
function Range(from, to) {
    this.from = from;
    this.to = to;
}

Range.prototype = {
    constructor : Range,
    includes : function(x) { 
        return this.from <=x && x <= this.to; 
    },
    foreach : function(f) { 
        for(var x=Math.ceil(this.from); x<=this.to; x++) 
            f(x); 
    }
};

// test
var r = new Range(1,3);
r.includes(2); // true
r.foreach( function(x){console.log(x)} ); // 1 2 3
{% endhighlight %}


### prototype属性

* 原型对象是类的唯一标识，当且仅当两个对象继承自同一个原型对象时，它们才属于同一个类的实例
* 构造函数其实并并没有其原型那么基础，但是构造函数却是类的“外在表现”，构造函数的名字常常用作类名，可以使用instanceof运算符来检测对象是否属于某个类：  
`r instanceof Range` // 如果r继承自Range.prototype，则返回true

还可以使用isPrototypeOf()来检测对象是否是实例对象的原型，如第一个例子中：`range.methods.isPrototypeOf(r)` 为true

### constructor属性
每个javascript函数都自动拥有一个prototype属性，这个属性的值是一个对象，它包含一个不可枚举属性constructor。  
constructor属性的值是一个函数对象：
{% highlight javascript %}
var F = function(){};
var p = F.prototype;
var c = p.constructor;
c === F // -> true: 对于任意函数 F.prototype.constructor == F

var o = new F();
o.constructor === F // -> true，constructor属性指代这个类
{% endhighlight %}

由于constructor是原型对象预定义的属性，上面的例子可以保留预定义属性并依次给原型对象添加方法：
`Range.prototype.includes = function(x) { return this.from <=x && x <= this.to; }`


## 面向对象技术
像C++中的面向对象类，具有实例字段，实例方法，类字段，类方法等概念。  
javascript中，方法都是以值的形式出现的，方法和字段没有太大的区别。  

**javascript中类相关的几个概念**：

* 构造函数对象：即构造函数（名），任何添加给构造函数的属性都是类字段或方法
* 原型对象：原型对象的属性被类的所有实例所继承
* 实例对象：类的每个实例都是一个对立的对象，直接给实例定义的属性不会为所有实例对象所共享

**javascript中定义类的三步走**：

1. 定义构造函数，并初始化新对象的实例属性
2. 给构造函数的prototype对象定义实例方法
3. 给构造函数定义类字段和类属性

{% highlight javascript %}
// 逻辑上通用的定义类的工具函数
function defineClass( constructor, methods, statics ) {
    if( methods ) extend(constructor.prototype, methods);
    if(statics) extend(constructor, statics);
    return constructor;
}
{% endhighlight %}


### 类的动态扩展
javascript中基于原型的继承机制是动态的：对象从原型继承属性，如果创建对象之后，原型的属性发生彼岸花，也会影响到继承自这个原型的所有实例对象。因此可以通过给原型对象添加新方法来扩充javascript类。

甚至javascript的内置类的原型对象也可以扩展，如：
{% highlight javascript %}
// 多次调用f，传入迭代数
Number.prototype.times = function(f, context) {
    var n = Number(this);
    for(var i=0; i<n; i++)
        f.call( context, i );
};

// test
var n = 3;
n.times( function(n) { console.log(n); } ); // 0 1 2
{% endhighlight %}

### 实例：实现枚举类型
{% highlight javascript %}
function enumeration( namesToValues ) {
    var enumeration = function() {
        throw "can't instantiate enumeration"; 
    };
    
    var proto = enumeration.prototype = {
        constructor : enumeration,
        toString : function() { return this.name; },
        valueOf : function() { return this.value; },
        toJSON : function() { return this.name; }
    };
    
    // 类字段
    enumeration.values = [];
    
    // 创建实例
    for (name in namesToValues) {
        // 创建基于原型的对象，使得 e instanceof enumeration
        var e = inherit(proto); 
        e.name = name;
        e.value = namesToValues[name];
        enumeration[name] = e;
        enumeration.values.push(e);
    }
    
    // 类方法
    enumeration.foreach = function(f, c) {
        for ( var i=0; i<this.values.length; i++ )
            f.call(c, this.values[i]);
    };

    // 返回构造函数
    return enumeration;
}


// test
var Coin = enumeration( {penny : 1, Nickel : 5, Dime : 10} );
var c = Coin.Dime;
c instanceof Coin; // true
c.constructor == Coin; // true
Coin.Dime == 10; // true
{% endhighlight %}


### 标准方法  
有些方法是javascript需要类型转换的时候自动调用的：

1. toString：返回一个可以标识该对象的字符串，比如在'＋'运算符连接字符串时会自动调用该方法。
2. toJSON：如果定义了，该方法将由JSON.stringify()自动调用。
3. 可以定义”准标准“方法：'equals', 'compareTo'来实现对象的比较。


### 关于私有状态
经典面向对象语言中一般都有关键字private，表示字段或方法时私有的，外部无法访问。

javascript中可以**通过闭包来模拟私有字段**，并用方法来访问这些字段；这个封装会让类实例看起来时不可修改的：  
{% highlight javascript %}
function Range(from, to) {
    this.from = function() { return from; };
    this.to = function() { return to; };
}

Range.prototype = {
    constructor : Range,
    includes : function(x) { 
       return this.from() <=x && x <= this.to(); 
    },
    foreach : function(f) { 
       for(var x=Math.ceil(this.from()); x<=this.to(); x++) 
           f(x); 
    }
};

// test
var r = new Range(1,5);
r.includes(3); // true
{% endhighlight %}


### 构造函数重载
构造函数重载（overload）在javascript中需要**根据传入参数的不同来执行不同的初始化方法**。

比如：集合Set类型的初始化：
{% highlight javascript %}
function Set() {
    this.values = {}; // 保存集合
    this.n = 0;       // 保存个数
    
    // 如果转入数组，则其元素添加到集合中
    // 否则，将所有参数都添加到集合中
    if ( arguments.length == 1 && isArrayLike(arguments[0]) )
        this.add.apply( this, arguments[0] );
    else if( arguments.length > 0 )
        this.add.apply( this, arguments );
}
{% endhighlight %}


## 子类
类B继承自类A，则A称为父类（superclass），B称为子类（subclass）：

* B的实例从A继承了所有的实例方法
* B还可以定义自己的实例方法，并且可以重载A中的同名方法，而且B中的重载方法可能会调用A中的重载方法，这种情形称为“方法链”
* 子类的构造函数B()有可能需要调用父类的构造函数A()，称为构造函数链

### 实现子类的关键：原型继承  
{% highlight javascript %}
B.prototype = inherit(A.prototype);
B.prototype.constructor = B;
{% endhighlight %}

### 构造函数与方法链  
NonNullSet继承自Set，Set实现了构造函数和add方法：
{% highlight javascript %}
function NonNullSet() {
    // 构造函数链
    Set.apply( this, arguments );
}

// 子类
NonNullSet.prototype = inherit( Set.prototype );
NonNullSet.prototype.constructor = NonNullSet;

// 重载add方法，用以过滤null
NonNullSet.prototype.add = function() {
    for ( var i=0; i<arguments.length; i++ )
        if( arguments[i] == null )
            throw new Error("can't add null");
    
    // 方法链
    Set.prototype.add.apply(this, arguments);
}
{% endhighlight %}


### 组合 vs. 继承  
组合：持有成员，并重写相关的方法，并且可能会使用持有成员的方法：
{% highlight javascript %}
function FilteredSet( set, filter ) {
    this.set = set;
    this.filter = filter;
}

FilteredSet.prototype = {
    constructor : FilteredSet,
    add : function() {
        if( this.filter ) {
            // filter elements
        }
        
        this.set.add.apply( this.set, arguments );
        return this;
    }
};
{% endhighlight %}


## 关于属性描述
{% highlight javascript %}
Object.defineProperty( o, prop, 
    {writable : false, configurable : false})
var descriptor = Object.getOwnPropertyDescriptor(o, prop);
{% endhighlight %}

[defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty){: : target="_blank"}的可配置的属性描述参考：

* configurable：设为true，则属性描述可以修改，并且属性可以从对象删除。默认为false
* enumerable：设为true，则属性可以被枚举到，默认false
* value：属性值，默认为undefined
* writable：设为true，则属性值可以用赋值运算符设置，默认false
* get：属性读取函数，默认undefined
* set：属性设置函数，默认undefined


## 模块化
模块创建时，避免污染全局变量的一种方法时使用一个对象作为命名空间，它将函数和属性作为命名空间对象的属性存储起来。

例如：命名空间为collections.sets
{% highlight javascript %}
var collections; // 声明（或重新声明）全局对象
if( !collections )
    collections = {};
collections.sets = {}    
{% endhighlight %}

### 匿名函数执行模块惯用法
{% highlight javascript %}
var Set = ( function namespace(){
    
    // 构造函数
    function Set() {
        this.values = {};
        this.n = 0;
        this.add.apply( this, arguments );
    }
    
    // 实例方法
    Set.prototype.contains = function(value) {
        return this.values.hasOwnProperty( v2s(value) );
    }
    
    
    // 内部辅助函数和变量
    function v2s(val) { /* ... */ }
    var nextId = 1;
    
    
    return Set;
}() );
{% endhighlight %}

