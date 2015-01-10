---
layout: article
title: phoenix in boost
category: boost
---

最主要的功能是使得对象间的转化更直接明白，底层是基于字符串流来实现：

- 提供常见类型之间的转换（如整型int, int64与字符串string,wstring间转换等等）
- 该库底层使用stringstream来实现并且可以很方便的扩展到自己定义的类型。
 
例如：

{% highlight c++ %}
#include "json_spirit.h"
 
#include <iostream>
#include <string>
using namespace std;
 
#include <boost/lexical_cast.hpp>
 
struct Item
{
    Item() : val(0) {}
 
    string str;
    int    val;
    string name;
};
 
ostream& operator << ( ostream & os, Item const& item )
{
    json_spirit::mObject obj;
    obj[ "str" ] = item.str;
    obj[ "val" ] = item.val;
    obj[ "name" ] = item.name;
    return os << json_spirit::write(obj);
}
 
istream& operator >> ( istream & is, Item & item )
{
    string json;
    is >> json;
 
    json_spirit::mValue val;
    if ( json_spirit::read( json, val ) )
    {
       try
       {
           json_spirit::mObject obj = val.get_obj();
           item.str = obj["str"].get_str();
           item.val = obj["val"].get_int();
           item.name = obj["name"].get_str();
       }
       catch (...)
       {
       }
    }
    return is;
}
 
int main()
{
    // lexical_cast运行时可能会抛异常
    try
    {
       // char 对应的字符
       char c = 'a';
       string s = boost::lexical_cast<string>( c );
       cout << s << endl;
 
       // char*
       char ac[] = { 'h', 'a', 0 };
       s = boost::lexical_cast<string>( ac );
       cout << s << endl;
 
       // char const*
       s = boost::lexical_cast<string>( "happy" );
       cout << s << endl;
 
       // int
       s = boost::lexical_cast<string>( (int)c );
       cout << s << endl;
 
       // string 2 int64
       __int64 val = boost::lexical_cast<__int64>( s );
       cout << val << endl;
 
       // user define type
       Item item;
       item.str = "zhenshan";
       item.val = 50;
       item.name = "suninf";
 
       string strItem = boost::lexical_cast<string>( item );
 
       Item item2 = boost::lexical_cast<Item>( strItem );
       cout << item2 << endl;
    }
    catch (...)
    {
       cout << "error occur..." << endl;
    }
 
 
    return 0;
}
{% endhighlight %}

输出：  
a  
ha  
happy  
97  
97  
{"name":"suninf","str":"zhenshan","val":50}

说明：

1. 直接使用lexical_cast需要用`try…catch`处理异常，因为当格式不符时会在运行时抛出异常。
2. 支持自定义扩展，实现两个`operator <<` 和`operator >>` 函数
3. 对于自定义类型，由于底层最终是使用流的序列化，因此我们可以将结构包装好输出到流；然后输入时，先完整的取出流，再解析即可。
4. 序列化和格式化的框架一般也是由字符串（流，文件等）实现的，这个与lexical_cast的格式化转化来看，也是相通的。



