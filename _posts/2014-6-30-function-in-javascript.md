---
layout: article
title: Function in javascript
category: javascript
description: 函数function在Javascript中是一等公民，是一种特殊的对象，函数可以作为参数传给其他高阶函数，支持匿名函数，还支持强大的闭包特征，总之javascript的函数是非常精彩的。
---
*函数function在Javascript中是一等公民，**是一种特殊的对象**，函数可以作为参数传给其他高阶函数，支持匿名函数，还支持强大的闭包特征，总之javascript的函数是非常精彩的。*

## 函数定义
函数使用function关键字来定义：

* 函数定义表达式  
`var square = function(x) { return x*x; }`

* 函数声明
{% highlight javascript %}
function distance( x1, y1, x2, y2 ) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    return Math.sqrt( dx*dx + dy*dy );
}
{% endhighlight %}


注意：

1. **函数声明语句“被提前”到外部脚本或外部函数作用域的顶部**，所以可以被在它定义之前的代码所调用。
2. 以表达式方式定义的函数，仅仅是变量的声明提前了，但是**变量的赋值没有提前**，所以在函数表达式定义之前无法调用。
3. 如果没有return语句或return语句没有值，则返回undefined

## 函数调用

### 作为函数

如：  
`var total = distance(0,0,2,1) + distance(2,1,3,5);`

### 作为方法

如果有函数f和对象o：  
`o.m = f;`  
给对象o定义了方法m()，`o.m(x,y)`  

方法调用与普通函数调用的重要区别：**调用上下文**。  
在上面的例子中，**对象o成为调用上下文，函数体中可以使用关键字this来引用该对象**。

### 作为构造函数

* 如果函数或方法调用之前带有关键字new，就构成构造函数调用
* 构造函数调用创建一个新的空对象，该对象会继承自构造函数的prototype属性
* 构造函数内部可以使用**this来引用新创建的对象**，并做初始化

### 通过call与apply来间接调用
函数也是对象，并且包含两个用于间接调用的方法：call() 和 apply()，两个都允许显式指定调用所需的this值，这样任何函数可以作为任何对象的方法来调用，哪怕这个函数不是那个对象的方法。

* call()方法**使用它自有的实参列表**作为函数的实参；
* apply()方法要求**以数组的形式传入参数**

### 关于this关键字:

* this是关键字，不是变量，也不是属性名，不允许对this的赋值。
* **方法链**：方法返回值是对象，则这个对象还可以调用它的方法。当方法并不需要返回值时，返回this，那么就能支持“链式调用”风格的编程，jQuery就是遵循这种API风格。
* 与变量不同，关键字this没有作用域的限制，嵌套的函数不会从调用的函数中继承this：**如果嵌套函数是方法调用，则this是指向调用它的对象**；**如果嵌套函数是普通函数调用，则this是全局对象**。
* 如果嵌套函数想访问外部函数的this值，可以**在外部函数中将this的值存到一个变量中**，如：

{% highlight javascript %}
var o = {
    m : function() {
        // 保存this到self，使嵌套函数可以访问self
        var self = this;
        console.log( this == o ); // true
        f();
        
        function f() {
            console.log( this == o ); // false
            console.log( self == o ); // true
        }
    }
};

o.m();
{% endhighlight %}

## 函数参数
概念：

* 形参：函数定义中指定的参数名
* 实参：函数调用过程中传递的参数值

### 可选形参

* 当调用函数时提供的实参比函数声明时的形参个数少，则剩下的形参被设置为undefined
* 参数默认值 **"\|\|惯用法"**
{% highlight javascript %}
function copy(o, p) {
    // 如果没有传递p值，使用新的空对象作为默认值
    p = p || {};
}
{% endhighlight %}

### 可变长的实参列表：实参对象arguments

* 函数体内，标识符arguments是指向实参对象的引用，实参对象是一个类数组对象，可以通过下标来访问传递的参数，因此可以操作任意数量的实参。
* 实参对象不是数组，**而是特殊的类数组对象，显式指定的实参的名字与arguments[n]用的是相同的引用**。

{% highlight javascript %}
function f(x) {
    console.log(x);
    arguments[x] = null;
    console.log(x); // 输出null
}
{% endhighlight %}


## 实参对象的callee与caller属性

* caller属性是指调用当前函数的函数；
* callee属性是指**当前正在执行的函数**，常用于实现递归函数
{% highlight javascript %}
var factorial = function(x) {
    if ( x < = 1 ) return 1;
    return x * arguments.callee(x-1);
};
{% endhighlight %}

## 对象作为实参

当实参数量比较多时，**最好通过名/值对的形式包装成对象**来做为一个参数传递
{% highlight javascript %}
function easycopy(args) {
    //...
}

var a = [];
easycopy( { from:[1,2,3,4], to:b, length:4 } );
{% endhighlight %}

## 作为值的函数
函数不仅有定义和调用这样的语法特征；还是值，可以将函数赋值给变量，可以存储在对象的属性或数组中，还可以作为参数传递给另外的函数。  
`function square(x) { return x*x; }`  
这个定义创建了一个新的函数对象，并将其赋值给变量square；而函数的名字实际上时看不见，square仅仅是变量的名字。函数还可以赋值给其他变量：  
`var s = square;`

函数也可以赋值给对象的属性：  
{% highlight javascript %}
var o = {
    square : function(x) { return x*x; }
};
var y = o.square(16); // 256
{% endhighlight %}


### 自定义函数属性
函数是特殊的对象，因此也可以拥有属性。
{% highlight javascript %}
function factorial(n) {
    if(n > 0) {
        if ( !(n in factorial) ) {
            factorial[n] = n * factorial(n-1);
        }
        return factorial[n];        
    } else {
        return NaN;
    }
}
factorial[1] = 1;

factorial(5); // 120
{% endhighlight %}


## 作为名字空间
由于在函数中声明的变量在整个函数体内是可见的，但是在函数外部是不可见的。  

惯用法：定义一个匿名函数，并直接在单个表达式中调用它
{% highlight javascript %}
( function() {
    // 模块代码
    // return ...
}() );
{% endhighlight %}

## 闭包
函数对象的内部状态不仅包含函数的代码逻辑，还必须引用当前的作用域链。函数体内的变量都可以保存在函数作用域内，这种特征称为“闭包”；

{% highlight javascript %}
var scope = "global";
function checkScope() {
    var scope = "local";
    return function() { return scope; }
}

checkScope()() // local
{% endhighlight %}

可以看到闭包的强大特征：**闭包可以捕捉局部变量（和参数），并一直保存下来。**

### 嵌套函数
函数可以嵌套在其他函数里：
{% highlight javascript %}
function createUuid() {
    var uuid_ = 0;
    return function() { return uuid_++; }
}

var uuid = createUuid();
uuid(); // 0
uuid(); // 1

var uuid2 = ( function(){
    var uuid_ = 0;
    return function() { return uuid_++; };
}() );

uuid2(); // 0
uuid2(); // 1
{% endhighlight %}

嵌套函数的有趣之处是它的变量作用域规则：它们可以访问嵌套它们（或多重嵌套）的函数的参数或变量。

### this与arguments

* 每个函数调用都包含一个this值，闭包外部函数的this，需要外部函数通过变量代理来访问，如：`var self = this;`，这样闭包内部可以通过self来访问。
* arguments也是每个函数都会自动声明的，与this一样，也可以通过外部函数通过变量保存起来给闭包访问。


## 函数属性，方法与构造函数

* 函数的length属性，表示函数定义时的参数个数。
* prototype属性，这个属性指向一个对象（原型对象）的引用，将函数用作构造函数时，新创建的对象会从原型对象上继承属性。
* call()与apply()方法：第一个参数时要调用函数的上下文，在函数体内可以通过this来获取它的引用。

{% highlight javascript %}
function f( y ) { return this.x * y }
var o = { x : 5 };
f.call( o, 3 ); // 15
f.apply( o, [4] ); // 20
{% endhighlight %}


### bind()函数
bind可以将部分的实参绑定给对象，然后返回一个新的函数。
{% highlight javascript %}
var sum = function(x,y) { return x+y; };
var succ = sum.bind(null, 1);
succ(2); // 3

function f(y,z) { return this.x + y + z; };
var g = f.bind( {x:1}, 2 );
g(3); // 6
{% endhighlight %}

## 函数式编程

### 使用函数处理数组
{% highlight javascript %}
var ary = [ 1,2,3,4,5 ];
ary.reduce( function(x,y){ return x+y; } ); // 15
{% endhighlight %}

### 高阶函数
高阶函数时操作函数的函数，它接收一个或多个函数作为参数，并返回一个新函数。

* 对函数取非
{% highlight javascript %}
// not
function not(f) {
    return function() {
        var result = f.apply(this, arguments);
        return !result;
    }
}
var even = function(x) { return x%2 === 0; };

var odd = not(even);
[1,3,5].every( odd ); // true
{% endhighlight %}

* 组合函数f(g(x))
{% highlight javascript %}
// compose(f,g)(x) -> f(g(x))
function compose(f, g) {
    return function() {
        var result = g.apply( this, arguments );
        return f.call( this, result );
    }
}

var square = function(x) { return x*x; };
var sum = function(x,y) { return x+y; };
var squareofsum = compose( square, sum );
squareofsum( 2,3 ); // 25
{% endhighlight %}

* 按右边绑定数据
{% highlight javascript %}
// bindRight
function array(a, n) {
    return Array.prototype.slice.call( a, n||0 );
}

function bindRight( f ) {
    var right_args = arguments;
    return function() {
        var a = array( arguments );
        a = a.concat( array(right_args, 1) );
        return f.apply( this, a );
    }
}

function f(x,y,z) { return x * (y - z); }
f.bind( null, 5, 6 )( 3 ); // 15
bindRight(f, 6, 3)(5); // 15
{% endhighlight %}