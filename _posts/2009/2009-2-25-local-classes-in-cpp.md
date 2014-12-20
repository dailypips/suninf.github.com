---
layout: article
title: C++局部类
category: c++ 
---
*C++局部类的最主要特点是能对外隐藏实现，与java的嵌套类是一个概念。由于不能访问外部类的成员，能力还是比较弱的。*

## 局部类（Local Classes）

1. 在函数内部定义的类为局部类，专为函数内部使用，以实现某种功能，一般来说可以用外部类代替，但局部类也有一些自身的特征
2. 局部类不能定义static成员变量，也不能访问函数内部类外部的non-static局部变量，而且可以使用函数模板的模板参数
3. 外部不能继承一个隐藏在函数内部的局部类

## Example

{% highlight c++ %}
#include <iostream>
using namespace std;

class Base {
public:
  Base() { cout << "create Base" << endl; }
  virtual ~Base() { cout << "delete Base obj" << endl; }
};

template< typename T >
Base* Create( T dat )   
{
  // 模板函数内定义的Derived是Local类
  class Derived : public Base {
  public:
    Derived( T t ) : data( t )
    { 
      cout << "create Derived" << endl;
      cout << "data : " << data << endl;
    }
    ~Derived() { cout << "delete Derived obj" << endl; }

  private:
    T data;
  };

  // 返回派生类对象的指针，只能用此函数间接产生
  return new Derived(dat);
}

int main()
{
  Base* p = Create(5);
  delete p;
  cout << "\n";

  p = Create("suninf");
  delete p;

  return 0;
}
{% endhighlight %}
 