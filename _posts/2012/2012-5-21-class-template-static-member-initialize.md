---
layout: article
title: 类模板的静态成员初始化
category: c++
---

与类模板的成员函数的非内联定义一样，类模板的static类型的数据成员需要使用外层模板的声明方式来初始化。

## 例子

{% highlight c++ %}
template <typename T>
class CSingleton
{
public:
    static T* Instance()
    {
        Lock::CLockWrapper guard(CriticalSection_);
        if (m_instance == NULL)
        {
            m_instance = new T;
        }
        
        ASSERT(m_instance != NULL);
        
        return m_instance;
    };
    
    static void DestroyInstance()
    {
        Lock::CLockWrapper guard(CriticalSection_);
        if (m_instance)
            delete m_instance;
        m_instance = NULL;
    };
 
protected:
    CSingleton()
    {
    };
 
    virtual ~CSingleton()
    {
    };
 
private:
    CSingleton(const CSingleton& source)
    {
    };
 
    static T* m_instance;
    static Lock::CCriticalSectionWrapper CriticalSection_;
};
 
template <typename T>
Lock::CCriticalSectionWrapper CSingleton<T>::CriticalSection_;
 
// 类模板的静态成员初始化语法
template <typename T> 
T* CSingleton<T>::m_instance = NULL;

{% endhighlight %}
