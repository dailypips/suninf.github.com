---
layout: article
title: C++对象的构造和析构语义
category: c++ 
---

本文分析C++对象的构造和析构语义。

## OO与OB的比较

OB(Object-based)：抽象数据结构模型（abstract data type model, ADT），把数据结构封装，提供public方法来使用，比如：STL中的vector，string等都是OB的范例，比起OO速度更快，空间也更紧凑，高效率是因为所有函数引发操作都在编译期解析完成，对象构建不需要设置virtual机制；空间紧凑是因为不用为支持virtual而额外付出的负荷。
 
OO(object-oriented)：通过类型继承以及virtual机制，以及使用引用或指针的方式（本质上，引用通常是用指针来实现的），来运行期动态决策以实现多态，而且继承和接口实现的方式有很大的灵活性。
 
 
## 关于nontrivial default constructor，有效的默认构造函数

首先默认构造函数是指没有参数的构造函数，当用户没有显式定义任何构造函数时，编译器才会为我们生成一个。  

需要注意的是，这个隐式生成的默认构造函数有自己特定的行为，只有base class subobjects和member class boject会被初始化，即调用基类的默认构造函数，以及类成员的默认构造函数，如果它们没有对应的默认构造函数，编译出错。其他如整数，指针等都不会被初始化（内存数据是随机的），这是程序员需要显式控制的责任。

有一个概念上的问题，构造函数控制中：程序员的责任和编译器的责任，编译器保证要做好对象的初始化（如果用户没有调用构造函数，编译器要主动调用默认构造函数），以及一些底层的控制，比如virtual机制的虚函数表也是类的指针成员；而用户需要控制整数，指针等的初始化，以及需要自己控制的对象的初始化，显式调用构造函数。
 
下面介绍4种，编译器做的事情：

- 带有default constructor的成员类对象( member class object )  
    - 如果类没有任何构造函数，这种情况下隐式合成的默认构造函数，会调用成员类对象的默认构造函数。
    - 另一个比较有趣的问题是：如果class A内含一个或一个以上的member class objects，class A的每一个构造函数都要调用这些member class objects的默认构造函数（如果没有显式对它们调用构造函数来初始化的话）。也就是说，编译器会对已经定义的构造函数做扩张，来保证所有member class objects都调用了对应的构造函数。
 
- 带有default constructor 的基类  
派生类的构造函数中，如果没有显式调用基类的构造函数，则编译器也会扩张调用基类的默认构造函数。
 
- 带有virtual function的class  
因为带有虚函数的类，必须维护一个虚函数表，它用一个指向表的指针作为类成员来实现的，构造函数中，编译期要做好虚函数表的建立和表指针的初始化。

- 带有virtual base class的class  
对于virtual基类，此时获取共享基类的指针有另一套规则，需要一个间接层管理，这也是由编译器构造函数中要做的初始化任务。

## 关于copy constructor和copy assignment operator的说明

当用户没有显式指定拷贝构造函数和赋值运算符时，编译器都会为我们隐式的制定，它会表现出两种copy的特点：对于整数和指针等，直接拷贝（bitwise copy semantics 位逐次拷贝）；对于member class objects，则会调用对应类的拷贝构造函数或赋值运算符（由于成员类对象也会进行类似的拷贝，可以看到这个过程是递归进行的）。

关于赋值运算符的说明：

- 没有构造函数的初始化列表，需要在函数体内设置
- 需要判断是否是自身拷贝
- 对于基类的赋值，需要显示调用基类的operator=，即Base::operator = ( rhs )
 
 
## 关于构造函数的初始化序列

编译器会一一操作初始化序列（比如整数设初值，类成员的构造函数等），并以声明次序在构造函数中安插初始化操作，并且是在任何用户写的构造函数的函数体之前。

下面的情况必须使用初始化列表：

- 初始化一个reference member
- 初始化一个const member
- 调用base class的构造函数，而它拥有一组参数
- 调用一个member class的构造函数，而它拥有一组参数
 
 
## 继承体系下的对象构造

构造函数的调用过程:

- 所有的virtual base classes和上一层的base class的构造函数会被调用。
- 自身对象的vptr初始化，指向相关的virtual table。
- 成员初始化列表展开。
- 用户提供的函数体内的代码。

特别提醒：

- 经由派生类对象的创建（或析构），在基类class的构造函数（或者析构函数）中，直接或者间接的调用虚函数，其函数实体其实是该类中定义的虚函数（甚至可能是纯虚函数而导致崩溃），并不会动态映射到派生类的虚函数。
- 所以一个重要的原则是：构造函数和析构函数中不要直接或间接的调用虚函数。构造和析构函数只要负责自己成员的管理。
 
 
## 析构函数语义

析构函数应该在需要时才提供。

继承体系下的析构函数的执行：

- 如果对象有vptr，则重设vptr
- 自己析构函数的函数体执行
- 该类型的类成员对象按照声明顺序的相反顺序析构，如果对应的析构函数
- 直接（上一层）的非虚基类（nonvirtual base classes），按照声明顺序的相反顺序析构，如果对应的析构函数。
- 析构virtual base classes