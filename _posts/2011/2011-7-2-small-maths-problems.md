---
layout: article
title: 一些数学小问题
category: algorithm
---

整理分析了一些经典的小问题。

### 一、最大公约数问题

分析：

1、求x，y的最大公约数，用**辗转相除法**

~~~~
设k = x / y，b = x % y，则x = ky + b，
因此( x, y ) = ( ky +b, y ) = (y, b)，
因此( x, y ) = ( y, x % y )，并且( 0, x) = x。
~~~~

关键就是将两个较大的数的公约数转化为两个较小数的公约数。

{% highlight c++ %}
int gcd( int x, int y )
{
    return (y==0) ? x : gcd( y, x%y );
}
{% endhighlight %}

2、进一步，由于**取模运算是比较慢的**，考虑到`(x, y) = ( x - y, y ) 假设x > y`，因此可以加速。

{% highlight c++ %}
int gcd( int x, int y )
{// x >= y
    if ( x < y )
       return gcd(y, x);
 
    return (y==0) ? x : gcd(x-y, y);
}
{% endhighlight %}

3、更进一步，虽然减法加速了，但是递进的速度不够快，考虑极端的情况( 1000000000, 1 )，这样用方法2将非常郁闷。还是需要想办法，尽量结合上面两种优势：**向目标递进速度与每次运算效率。**

注意到：

~~~~
若x = k * x1, y = k * y1，则(x, y) = (x1, y1)，
另外，对于素数p，若x = p * x1，且y % p != 0，那么(x, y) = (p*x1, y) = (x1, y)
~~~~

这个素数p的最优选择就是2，因为除以2可以用移位操作简单的代替：

~~~~
若x, y均为偶数： ( x, y ) = 2*( x>>1, y>>1 )
若x奇，y偶：     ( x, y ) = (x, y>>1)
若x偶，y奇：     ( x, y ) = (x>>1, y)
若x,y均为奇数：  ( x, y ) = (x, x-y)，由于x-y为偶，下一步会除以2
~~~~

{% highlight c++ %}
bool IsEven( int n )
{
    return !(n & 0x01);
}
 
int gcd( int x, int y )
{// x >= y
    if ( x < y )
       return gcd(y, x);
 
    if ( y == 0 )
    {
       return x;
    }
    else
    {
       if ( IsEven(x) )
       {
           if ( IsEven(y) )
              return (gcd(x>>1, y>>1) << 1);
           else
              return gcd(x>>1, y);
       }
       else
       {
           if ( IsEven(y) )
              return gcd(x, y>>1);
           else
              return gcd(x-y, y);
       }
    }
}
{% endhighlight %}


### 二、把整数`N`转化成k个严格递增正整数整数序列`n1, n2, …, nk`的和，请问有多少种情况？
 
设函数 f( n, m )表示n的递增序列和式中最大值小于等于m的数量。那么，如果n分解的最大值为m，则有f( n-m, m-1 )种；最大值小于m，则有f(n, m-1)种。

则有：

~~~~
若n > m：f(n, m) = f( n-m, m-1 ) + f( n, m-1 )
若n <= m：f(n, m) = f(n, n) = 1 + f(n,n-1)
~~~~

初始条件：

~~~~
f( 1, 1 ) = 1
f(i,1) = 0 其中i>1
~~~~

例程：

{% highlight c++ %}
#include <iostream>
#include <cstdio>
#include <vector>
using namespace std;
 
enum { max_len = 501 };
double cases[max_len][max_len];
 
class StairCases
{
public:
    StairCases() { init(); }
 
    double get_num(int n)
    {
       return lookup(n, n) -1;
    }
 
private:
    double lookup( int n, int m )
    {
       if ( cases[n][m] >= 0 )
       {
           return cases[n][m];
       }
       if ( n==1 && m==1 )
       {
           return cases[n][m] = 1;
       }
 
       if ( n>1 && m==1 )
       {
           return cases[n][m] = 0;
       }
 
       if ( n <= m )
       {
           return cases[n][n] = 1+lookup( n, n-1 );
       }
       else // n>m
       {
           return cases[n][m] = lookup(n-m, m-1) + lookup(n, m-1);
       }
    }
 
    void init()
    {
       for ( int i=1; i<max_len; ++i )
       {
           for ( int j=1; j<max_len; ++j )
           {
              cases[i][j] = -1;
           }
       }
 
       for ( int i=2; i<max_len; ++i )
       {
           cases[i][1] = 0;
       }
       cases[1][1] = 1;
    }
};
 
int main()
{
    StairCases sc;
    int n;
    while ( cin >> n && n  )
    {
       printf( "%.0f\n", sc.get_num(n) );
    }
    return 0;
}
{% endhighlight %}


### 三、将一个正整数n表示成一系列正整数之和，`n = n1 + n2 + … + nk`，其中`n1 >= n2 >= … >= nk >= 1`.求整数n的划分个数，并展示这些划分。
 
分析：设f(n,m)为n的不同的划分中，最大加数小于等于m的个数。则有，

~~~~
若n > m：f(n,m) = f(n-m,m) + f(n,m-1) (对应最大值为m和小于m两种情况)
若 n <=m: f(n,m) = f(n,n) = 1 + f(n,n-1) n>1

初始值：f(n,1) = 1, n>=1
       f(1,n) = 1
~~~~


例程：

{% highlight c++ %}
#include <iostream>
#include <vector>
using namespace std;
 
typedef vector< vector<int> > split_vect;
 
split_vect split( int n, int m )
{
    if ( n==1 )
    {
       vector<int> cur( 1,1 );
       return split_vect( 1, cur );
    }
 
    if ( m==1 )
    {
       vector<int> cur( n,1 );
       return split_vect( 1, cur );
    }
 
    if ( n <= m )
    {
       split_vect ret( 1, vector<int>(1,n) );
       split_vect const& tmp_ary = split( n,n-1 );
       ret.insert( ret.end(), tmp_ary.begin(), tmp_ary.end() );
       return ret;
    }
    else // n > m
    {
       split_vect ret;
       split_vect tmp_ary1 = split( n-m,m );
       for ( int i=0; i<(int)tmp_ary1.size(); ++i )
       {
           tmp_ary1[i].push_back( m );
       }
       split_vect const& tmp_ary2 = split( n,m-1 );
       ret.insert( ret.end(), tmp_ary1.begin(), tmp_ary1.end() );
       ret.insert( ret.end(), tmp_ary2.begin(), tmp_ary2.end() );
       return ret;
    }
}
 
void print( vector<int> const& v )
{
    for ( int i=0; i<(int)v.size(); ++i )
    {
       cout << v[i] << " ";
    }
    cout << endl;
}
 
int main()
{
    split_vect const& ret = split(8, 8);
    cout << "kinds: " << ret.size() << endl;
    for ( int i=0; i<(int)ret.size(); ++i )
    {
       print( ret[i] );
    }
    return 0;
} 
{% endhighlight %}