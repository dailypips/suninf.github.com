---
layout: article
title: 字符串匹配搜索
category: algorithm
---

本文介绍两种字符串查找算法，KMP模式匹配以及python的fastsearch代码。

## KMP模式匹配解析

### 先从最传统的子字符串匹配引出：

{% highlight c++ %}
#include <iostream>
using namespace std;
// 从原字符串src中，完全匹配首个pattern字符串
int Index( string const& src, string const& pattern, int pos = 0 )
{
    if ( src.size()-pos < pattern.size() )
       return -1;
 
    int i = pos;
    int j = 0;
    while ( i<(int)src.size() && j<(int)pattern.size() )
    {
       if ( src[i]==pattern[j] )
       {
           ++i;
           ++j;
       }
       else
       {
           // i前进了j次++，i要回溯到之前的下一轮;j回溯从0开始
           i = i-j+1;
           j = 0;
       }
    }
 
    if ( j >= (int)pattern.size() )
       return i - pattern.size();
 
    return -1;
}
 
int main()
{
    cout << Index( "abcdef", "de" ) << endl; // 输出 3
    return 0;
}
{% endhighlight %}

这样能找到第一次完全匹配的下标，但是注意到一旦匹配不上时，i的回溯 `i = i-j+1`;，找不到时，i要回到之前的位置加1，j回溯到0因此复杂度是O( M*N )。
 
注意到我们的终极目标是让pattern的下标j消耗完，可是上面的方法，一旦某位置匹配失败每次都将j重置为0，这没有充分利用pattren自己的特征，比如从原字符串”ddabdabdabc”中查找”abdabc”，如果当前的最后一个c与原字符串的d失配。

注意到两个特征：

1. 原串匹配到失配点’d’，它之前与c之前的abdab是完全匹配的；
2. c前面的ab与pattern首开始的ab是一样的串，j下标没有必要回到0，可以定位到开始的ab之后，即下标为2，而且由于之前原字符串的已经有了部分匹配的保证。
 

### KMP模式匹配
 
对于pattern串，自身模式匹配的`next[j]`下标计算：

~~~~
next[0] = -1; // 实现算法时方便计算
next[j] = max{ k | 0<k<j 且 “p[0] p[1]…p[k-1]” == “p[j-k] p[j-k+1]…p[j-1]” }
next[j] = 0; // 其他情况的默认值

注意：
next[j] = max{ k | 0<k<j 且 “p[0] p[1]…p[k-1]” == “p[j-k] p[j-k+1]…p[j-1]” }的意思是当前下标j，之前的0～j-1可能存在首尾完全自匹配，我们找出最大的。比如abcdabc，最后一个c的下标为6，在abcdab中存在的最大首尾子匹配是ab，因此next[6] = 2; // 第一个c的位置
~~~~

所以，综合利用pattern自身的每一个字母为边界的自身模式匹配，和当前原字符串与pattern串的部分匹配，可以这样设计：
维持两个下标，原字符串和pattern串之间，从开头开始匹配，一旦遇到失配，原字符串下标不变，pattern的下标j切换到自身模式匹配的next[j]下标，然后继续接着匹配。
 
{% highlight c++ %}
// 经典的KMP模式匹配实现
#include <iostream>
#include <string>
#include <vector>
using namespace std;
 
int KMP( string const& src, string const& pattern, int pos = 0 )
{
    if ( src.size()+pos < pattern.size() )
       return -1;
    // 求next数组的算法
    std::vector<int> next( pattern.size(), 0 );
    next[0] = -1;
    int i = 0;
    int j = -1;
    while ( i < (int)pattern.size()-1 )
    {
       if ( j==-1 || pattern[i] == pattern[j] )
       {
           ++i;
           ++j;
           next[i] = j;
       }
       else
           j = next[j];
    }
 
    // kmp
    i = pos;
    j = 1;
    while ( i<(int)src.size() && j<(int)pattern.size() )
    {
       if ( j==-1 || src[i]==pattern[j] )
       {
           ++i;
           ++j;
       }
       else
           j = next[j];
    }
 
    if ( j >= (int)pattern.size() )
       return i - pattern.size();
 
    return -1;
}
 
int main()
{
    cout << KMP( "abcd", "cd" ) << endl;
    return 0;
}
{% endhighlight %}


## fastsearch
 
fastsearch是用于python的核心查找算法，直接影响着python的性能，设计的非常高效，比起KR，KMP，速度有一个数量级以上的提升。
 
C源码：[官方C代码](http://svn.python.org/view/python/trunk/Objects/stringlib/fastsearch.h?revision=77470&view=markup){: target="_blank"}
 
改装成查找和计数分离：[下载代码](/resources/fastsearch_count.rar)