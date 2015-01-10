---
layout: article
title: C++0x 多线程
category: c++
---

C++0x对多线程有了直接的支持，这对于跨平台的统一的线程管理和使用是个福音。
 
C++0x多线程库提供了std::thread类，用于创建和管理线程，还为共享资源的竞态问题提供了互斥量（mutex）、锁、事件通知的条件变量（condition variable）和获取异步调用的返回值（future）等。
 
## std::thread  `<thread>`

### 构造函数：

`thread();`  
thread对象处于初始状态。

~~~~
template<class Fn, class... Args>
explicit thread(Fn&& F, Args&&... A);
~~~~

提供函数（函数，函数对象，lambda函数），以及提供可选的参数，参数是右值引用方式传递。

`thread(thread&& Other);`  
move语义，获取Other对象的状态，并使其处于初始状态。


注：

1. 参数是右值引用类型，默认很可能会引用到局部变量。
2. 函数参数推荐使用拷贝语义，这样可以避免引用引起的生命期问题。
 
例如：

{% highlight c++ %}
#include <iostream>
#include <thread>
#include <string>
using namespace std;
 
int main()
{
    thread thd;
    {
       // 值传递
       auto func = [](string s)
       {
           // 等待5秒，保证外层的引用传递的str已析构
           std::chrono::milliseconds dura( 5000 );
           this_thread::sleep_for( dura ),
              cout << s;
       };
 
       string str = "hello world!";
 
       thd.swap( thread( func, str) ) ;
    }
 
    thd.join();
 
    return 0;
}
{% endhighlight %}
 
 
### 成员函数

`id get_id() const;`  
获取线程的标识，类型是thread::id，如果没有关联的线程，则返回id()
 
`bool joinable() const;`  
对象是否有关联的线程执行，即get_id() != id()
 
`void detach();`  
解除对象与线程体的关联，由系统负责线程结束的资源释放，如果不是joinable，将抛出system_error异常。
 
`void join();`  
调用线程阻塞，直到对象关联的线程执行完成。如果非joinable，则抛出system_error异常。
 
`native_handle_type native_handle();`  
返回线程句柄，native_handle_type在不同的平台有不同的实现：

- Win32 : `typedef void * native_handle_type;`
- Linux : `typedef pthread_t native_handle_type;`
 
`thread& operator = ( thread&& Other );`  
关联右值对象对应的状态，而本身状态如果是joinable的，则会调用detach()。
 
`void swap(thread& Other);`  
交换两个对象的状态。
 
 
## 管理当前线程的this_thread名字空间

`thread::id get_id();`  
返回当前线程的id
 
`void yield();`  
线程取消当前时间片，让操作系统重新调度。

~~~~
template< class Rep, class Period >
void sleep_for( std::chrono::duration<Rep,Period> sleep_duration );
当前线程等待一段时间
~~~~

~~~~
template< class Clock, class Duration >
void sleep_until( const std::chrono::time_point<Clock,Duration>& sleep_time );
当前线程一直等待到 sleep_time 为止。
~~~~
 

## mutex 互斥量  `<mutex>`

### mutex相关类型

- **std::mutex类**

`mutex();`  
构造函数，初始处于未锁定状态
 
`bool try_lock();`  
尝试去锁定mutex，立即返回。返回true则获取锁成功；否则失败。
 
`void lock();`  
锁定mutex，如果mutex当前被其他线程占有，则lock将阻塞调用线程，直到mutex被其他线程释放了。
注：如果线程已经拥有mutex，则在该mutex上再次调用lock将导致死锁异常。
 
`void unlock();`  
释放mutex。
 
 
- **std::recursive_mutex**

支持递归锁定，即：如果线程已经拥有mutex，在该mutex上再次调用lock会成功，不过要求unlock与lock数量匹配。
 
- 支持等待时间的 **timed_mutex与recusive_timed_mutex**
 
 
### mutex辅助管理

- **lock_guard**

~~~~
template< class Mutex >
class lock_guard;
~~~~

支持RAII的方式自动管理mutex类。
 
例如：

{% highlight c++ %}
recursive_mutex mtx;
// ...
{
    lock_guard<recursive_mutex> guard( mtx );
    // ...
}
{% endhighlight %}

- **unique_lock**

~~~~
template< class Mutex >
class unique_lock;
~~~~

构造函数：

`unique_lock();`
 
`unique_lock( unique_lock&& other );`
 
`explicit unique_lock( mutex_type& m );`  
初始化锁定m.lock()
 
`unique_lock( mutex_type& m, std::defer_lock_t t );`  
不锁定mutex
 
`unique_lock( mutex_type& m, std::try_to_lock_t t );`  
尝试锁定mutex
 
`unique_lock( mutex_type& m, std::adopt_lock_t t );`  
假定线程已经拥有该mutex

~~~~
template< class Rep, class Period >
unique_lock( mutex_type& m,
const std::chrono::duration<Rep,Period>& timeout_duration );
尝试锁定m，阻塞直到m成功获取或者时间段timeout_duration已过
~~~~

~~~~
template< class Clock, class Period >
unique_lock( mutex_type& m,
const std::chrono::time_point<Clock,Duration>& timeout_time );
~~~~

析构函数：

`~unique_lock`  
如果已取得关联的mutex的所有权，则释放该mutex。

其他函数：

`void lock();`  
锁定关联的mutex，如果没有关联的mutex或mutex已经锁定，将抛出system_error异常。
 
`bool trylock();`  
尝试锁定关联的mutex，如果没有关联的mutex或mutex已经锁定，将抛出system_error异常。
 
`void unlock();`  
unlock关联的mutex，如果没有关联的mutex或mutex未锁定，将抛出system_error异常。
 
~~~~
template< class Rep, class Period >
bool try_lock_for( const chrono::duration<Rep,Period>& timeout );

template< class Clock, class Duration >
bool try_lock_until( const std::chrono::time_point<Clock,Duration>& timeout_time );
~~~~

`mutex_type* release();`  
取消mutex的关联，但不会调用unlock。

~~~~
template< class Mutex >
void swap( unique_lock<Mutex>& other );
交换两个锁的状态。
~~~~
 
`bool owns_lock() const;`  
判断是否已经拥有锁。
 
`explicit operator bool() const; // 同owns_lock()`
 
 
### 通用锁定算法

用避免死锁的算法同时获取多个mutex：

{% highlight c++ %}
template< class Lockable1, class Lockable2, class LockableN... >
int try_lock( Lockable1& lock1, Lockable2& lock2, LockableN& lockn... );
 
template< class Lockable1, class Lockable2, class LockableN... >
void lock( Lockable1& lock1, Lockable2& lock2, LockableN& lockn... );
{% endhighlight %}

例如：有时候分开获取锁，很容易导致死锁。可以用通用锁定算法来避免。

{% highlight c++ %}
void f()
{
    // ...
    // make locks but don't yet try to acquire the mutexes
    std::unique_lock lck1(m1,std::defer_lock);   
    std::unique_lock lck2(m2,std::defer_lock);
    std::unique_lock lck3(m3,std::defer_lock);
    lock(lck1,lck2,lck3);
    // manipulate shared data
}
{% endhighlight %}

## 条件变量 `<condition_variable>`

### condition_variable类

`condition_variable();`  
构造函数
 
`~condition_variable();`  
析构函数，必须保证没有线程还在等待该条件变量，否则会一起程序异常。
 
`void wait( std::unique_lock<std::mutex>& lock );`

{% highlight c++ %}
template< class Predicate >
void wait( std::unique_lock<std::mutex>& lock, Predicate pred );
{% endhighlight %}

当前线程等待该条件变量触发notify，使用条件变量时需要配合`unique_lock<mutex>`使用：

- 当等待时，mutex将被解锁（调用wait前应该已经获取锁），线程等待notify
- 可选的谓词，当notify时，将继续等待谓词条件，`while( !pred() ) { wait(lock); }`
- 当notify_all或notify_one执行后，可能触发线程unblock，wait结束，锁已获取
 
例如：

{% highlight c++ %}
#include <iostream>
#include <condition_variable>
#include <thread>
#include <mutex>
 
std::condition_variable cv;
std::mutex cv_m;
bool done = false;
 
void waits()
{
    std::unique_lock<std::mutex> lk(cv_m);
    std::cout << "Waiting... \n";
    cv.wait(lk, [](){return done;});
    std::cout << "...finished waiting.\n";
}
 
voidsignals()
{
    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::cout << "Notifying...\n";
    cv.notify_one();
 
    std::unique_lock<std::mutex> lk(cv_m);
    done = true;
}
 
int main()
{
    std::thread t1(waits), t2(signals);
    t1.join();
    t2.join();
}
{% endhighlight %}

输出：  
Waiting...  
Notifying...  
...finished waiting.
 
 
`void notify_one();`  
唤醒当前等待条件变量的其中一个线程。
 
`void notify_all();`  
唤醒所有等待当前条件变量的线程。

{% highlight c++ %}
template< class Rep, class Period >
std::cv_status wait_for( std::unique_lock<std::mutex>& lock,
                const std::chrono::duration<Rep, Period>& rel_time);
                
template< class Rep, class Period, class Predicate >
bool wait_for( std::unique_lock<std::mutex>& lock,
const std::chrono::duration<Rep, Period>& rel_time, Predicate pred);
 
template< class Clock, class Duration >
std::cv_status wait_until( std::unique_lock<std::mutex>& lock,
     const std::chrono::time_point<Clock, Duration>& timeout_time );
     
template< class Clock, class Duration, class Predicate >
bool wait_until( std::unique_lock<mutex>& lock，
 const std::chrono::time_point<Clock, Duration>& timeout_time, Predicate pred );
// 支持等待一段时间。
{% endhighlight %}
 
例子（生产者&消费者）：

{% highlight c++ %}
#include <condition_variable>
#include <mutex>
#include <thread>
#include <iostream>
#include <queue>
#include <chrono>
 
int main()
{
    std::queue<int> produced_nums;
    std::mutex m;
    std::condition_variable cond_var;
    bool done = false;
    bool notified = false;
 
    std::thread producer([&]()
    {
       for (int i = 0; i < 5; ++i)
       {
           std::this_thread::sleep_for(std::chrono::seconds(1));
           std::unique_lock<std::mutex> lock(m);
           std::cout << "producing " << i << '\n';
           produced_nums.push(i);
           notified = true;
           cond_var.notify_one();
       }  
 
       done = true;
    });
 
    std::thread consumer([&]()
    {
       std::unique_lock<std::mutex> lock(m);
       while (!done)
       {
           while (!notified)
           {  // 没有notify，继续等待，只有这里会释放锁
              cond_var.wait(lock);
           }  
           while (!produced_nums.empty())
           {
              std::cout << "consuming " << produced_nums.front() << '\n';
              produced_nums.pop();
           }  
           notified = false;
       }  
    });
 
    producer.join();
    consumer.join();
}
{% endhighlight %}

输出：  
producing 0  
consuming 0  
producing 1  
consuming 1  
producing 2  
consuming 2  
producing 3  
consuming 3  
producing 4  
consuming 4  
 
 
### condition_variable_any类

是condition_variable的一个泛化，支持任意类型的锁。

成员签名：

`condition_variable_any();`
 
`void notify_one();`
 
`void notify_all();`

{% highlight c++ %}
template< class Lock >
void wait( Lock& lock );
 
template< class Lock, class Predicate >
void wait( Lock& lock, Predicate pred );
 
template< class Lock, class Rep, class Period >
std::cv_status wait_for( Lock& lock,
                const std::chrono::duration<Rep, Period>& rel_time);
 
template< class Lock, class Rep, class Period, class Predicate >
bool wait_for( Lock& lock,
 const std::chrono::duration<Rep, Period>& rel_time,Predicate pred);
{% endhighlight %}
 
## future相关  `<future>`

future提供了一种直接获取异步操作返回值的方式。

### std::async函数

{% highlight c++ %}
template< class Function, class... Args>
std::future<typename std::result_of<Function(Args...)>::type>
    async( Function&& f, Args&&... args );
 
template< class Function, class... Args >
std::future<typename std::result_of<Function(Args...)>::type>
    async( std::launch policy, Function&& f, Args&&... args );
{% endhighlight %}

async函数返回future对象：

- policy可以选择为std::launch::async或std::launch::deferred，前者会起thread异步执行函数f，后者延迟计算，直到future.get()调用时才去计算f。
- 默认情况下同`launch::async | launch::deferred`，可能异步也可能是查询时同步执行。
 
 
### future类

{% highlight c++ %}
template< class T > class future;
template< class T > class future<T&>;
template<>          class future<void>;
{% endhighlight %}

成员：

{% highlight c++ %}
future();

future( future&& other );
// 构造函数，不支持拷贝构造
 
future& operator=( future&& other );
 
T get();

T& get();

void get();
// get将进入等待，直到future具有合法的结果。调用以后valid()==false.
 
bool valid() const;
// future是否与shared state关联，即还未调用get()之前。
 
void wait() const;
// 等待future的结果可用。
 
template< class Rep, class Period >
future_status wait_for( const chrono::duration<Rep,Period>& tm );
// 等待结果一段时间。
{% endhighlight %}
 
例1：

{% highlight c++ %}
#include <iostream>
#include <future>
#include <thread>
#include <chrono>
using namespace std;
 
int main()
{
    future<int> future = async(launch::async, []()
    {
       this_thread::sleep_for(chrono::seconds(3));
       return 8; 
    });
 
    cout << "waiting...\n";
    future_status::future_status status;
    do
    {
       status = future.wait_for(chrono::seconds(1));
       if (status == future_status::deferred)
       {
           cout << "deferred\n";
       }
       else if (status == future_status::timeout)
       {
           cout << "timeout\n";
       }
       else if (status == future_status::ready)
       {
           cout << "ready!\n";
       }
    } while (status != future_status::ready);
 
    cout << "result is " << future.get() << '\n';
}
{% endhighlight %}

输出：  
waiting...  
timeout  
timeout  
ready!  
result is 8  
 
例2：

{% highlight c++ %}
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
#include <future>
 
template <typename RAIter>
intparallel_sum(RAIter beg, RAIter end)
{// 同步函数，但是async多线程加速
    typename RAIter::difference_type len = end-beg;
    if(len < 1000)
       return std::accumulate(beg, end, 0);
 
    RAIter mid = beg + len/2;
    auto handle = std::async(std::launch::async,
       parallel_sum<RAIter>, mid, end);
 
    int sum = parallel_sum(beg, mid);
    return sum + handle.get();
}
 
int main()
{
    std::vector<int> v(100000, 100);
    std::cout << "The sum is " << parallel_sum(v.begin(), v.end()) << '\n';
}
{% endhighlight %}

输出：  
The sum is 10000000