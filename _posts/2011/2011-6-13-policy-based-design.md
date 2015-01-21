---
layout: article
title: policy classes的设计理念
category: c++
---

当我们要提供可复用，高度灵活性的组件、类库等情况时，我们该如何着手？policy classes是一种重要的类的设计技术，能大大提高程序的弹性和可复用性，也是《C++设计新思维》作者Andrei Alexandrescu所推崇的技术。

**策略policy的基本想法**：
: 是把需要实现的类的一些**相对独立的行为（behavior）**提取出来，然后抽象出每个行为对应的应具备的接口，这就是一个policy，而你可以针对这个policy提供任意个版本的policy classes，并在使用时根据情况选择一个最合适的policy class作为真正使用的版本。
 
这种通过组合各种policies，得到的宿主类(host class)具有非常大的灵活性，而且每个host可以使用的policy class的数量以及实现一个policy的实现方式也不限。进一步来说，通过使用模板来实现，不仅能在编译器完成很多约束条件(traits生成类型，静态断言作为约束)，而且没有任何运行时（run-time）开销。
 
将一个host怎么**分解提取出合理的policies是最困难的问题**，一个准则是：

- 将参与class行为的设计鉴别出来并命名之，任何事情只要能用一种以上的方法实现或者解决，都应该被分析出来，从class提取出来作为一个policy。
- 从class分解出policies时，理论上需要找到正交分解（orthogonal decomposition），这样产生的policies是完全相互独立的。
- 如果两个policies之间没有相互影响，就为正交的。
 
## 关于使用到的技术要点的说明

### 多重继承

有时候所定义的policy class的成员函数需要被使用，并且不适合作为组合的方式（创建成员）来实现时，这时候需要用多重继承。需要注意的是，我们设计的泛型的host类，虽然从policy classes继承，但是它们不会被期望这样使用：使用host的指针或者引用，而实际却指向某个policy class。在这个前提下，我们的继承仅仅是使用基类的行为，而且析构函数也不用设计为virtual的，host的析构函数只用关心自己的成员的析构。

例如：

{% highlight c++ %}
// Loki库中的SmartPtr声明：
template
< 
    typename T,
    class OwnershipPolicy,
    class ConversionPolicy,
    class CheckingPolicy,
    class StoragePolicy
> 
class SmartPtr
    : public StoragePolicy::In<T>::type
    , public OwnershipPolicy::In<typename StoragePolicy::template PointerType<T>::type>::type
    , public CheckingPolicy ::In<typename StoragePolicy::template StoredType<T>::type>::type
    , public ConversionPolicy
{ };
{% endhighlight %}

### template template parameters 模板的模板参数

模板的模板参数，让policy classes技术更简洁。

一般来说，policy本身也是模板，它操作的对象类型与host操作的类型常常是一致的，这意味着我们常常会这么使用：`host< T, Policy1<T>, Policy2<T>… >`，尽管默认模板参数可以让我们在大多数情况下不用指定policy而可以简单的使用host类，但是这个冗余的T本可以省略的，因为我们期望这样来写，`host< T, Policy1, Policy2… >`，template template parameters带给了我们这种能力。

例子：

假设vector, list, deque等的模板参数为`template<T, Alloc>`，并且Alloc默认为`stdL::allocater<T>`，容器适配器stack使用时，需要`stack< int, vector<int> >`，即int被指定了两次，但是照道理来说，我们需要存储的确实就是int型的，没必要写两次。

{% highlight c++ %}
template
< 
    typename T,
    template<typename,typename> class Sequence = std::deque // 也可以提供默认
> 
class stack
{
public:
    // VS中的STL的vector,list,deque是这样的格式
    typedef Sequence<T,std::allocator<T> > Seq;
    typedef typename Seq::value_type value_type;
    typedef typename Seq::size_type size_type;
    typedef typename Seq::reference reference;
    typedef typename Seq::const_reference const_reference;
    
protected:
    Seq c;
    
public:
    bool empty() const { return c.empty(); }
    size_type size() const { return c.size(); }
    reference top() { return c.back(); }
    const_reference top() const { return c.back(); }
    void push(const value_type& x) { c.push_back(x); }
    void pop() { c.pop_back(); }
};
{% endhighlight %}

对于这个自定义的stack，我们就只需要一次指定类型了：`stack< int, std::vector >`就可以了。
 
## 使用policy classes的几种常用情况

### host类使用policy类的静态成员（函数）

Loki的Singleton也是这种方式实现的，它组合了对象创建（ObjectCreate），生命期(LifeTime)，多线程(ThreadingModel)支持三个policy。

假设情况：Policy需要得到一个指定类型的对象的指针，接口Create返回指针，Delete对应的进行删除。

{% highlight c++ %}
// 一种实现：
#include <iostream>
using namespace std;
 
template< typename T >
struct OpNewCreator
{
    static T* Create()
    {
       cout << "new" << endl;
       return new T;
    }
    static void Delete( T* p )
    {
       cout << "delete" << endl;
       delete p;
    }
};
 
template< typename T >
struct MallocCreator
{
    static T* Create()
    {
       cout << "malloc" << endl;
       void* buf = std::malloc( sizeof(T) );
       return buf==0 ? 0 : (new(buf) T);
    }
    static void Delete( T* p )
    {
       cout << "free" << endl;
       std::free( (void*)p );
    }
};
 
template
< 
    typename T,
    template< typename > class CreatePolicy = OpNewCreator
> 
class MyClass
{
    T* pdata;
public:
    MyClass() : pdata( CreatePolicy<T>::Create() )
    {}
    ~MyClass()
    {
       CreatePolicy<T>::Delete(pdata);
    }
 
};
 
int main()
{
    MyClass<int>();
    MyClass<int, MallocCreator>();
    return 0;
}
{% endhighlight %}

输出：  
new  
delete  
malloc  
free  
 
### policy扮演组合关系

policy类对象作为host类的一个成员，比如上面的stack的例子，我们需要一个存储器作为成员，由于存储器是可选择的，因此作为一个policy。
 
## policy classes作为host类的基类

policy classes作为host类的基类，是因为我们需要使用policy的成员函数。因为每个policy class都是细度很小并且对应一个独立的行为，因此，policy classes相互之间无影响；而且不存在虚函数，于是policy class集中注意力实现需要实现的接口，而host类只管调用policy提供的接口来完成自己的事情，析构函数不需要是虚函数，因为不会设计到动态类型识别，也不需要，因为类型信息对应模板来说都是编译期已知的。比如Loki中的SmartPtr的定义。

### 使用policy总结

很多时候policy class还有自己的自定义类型，数据成员，静态成员，普通成员函数之中的一些，我们需要根据情况选择是使用：

- 多重继承（细度较小，包含非静态成员函数和数据）；
- 组合（如果是比较复杂的对象，作为policy已经细度太大而不适合了，还不如policy class的对象作为成员而组合）；
- 还是直接引用policy class的名字就行了（例如包含的静态成员和自定义类型）。