---
layout: article
title: Synchronization in chrome
category: chrome
description: In Chrome code, message passing is far more common (via TaskRunner and PostTask) and low-level synchronization primitives like locks, condition variables and waitable_event should be used only when necessary. This article introduce the implement of synchronization mechanism in chrome source code.
---
*In Chrome code, message passing is far more common (via TaskRunner and PostTask) and low-level synchronization primitives like **locks**, **condition variables** and **waitable_event** should be used only when necessary. This article introduce the implement of synchronization mechanism in chrome source code.*

Some additional motivation:  

* Condition variables are nearly impossible to implement correctly on Windows XP or earlier. Chrome's implementation is correct, but _very_ slow. 
* Whenever you use a CV you are disproportionately harming our performance on Windows.
* A lot of times people just want to wait on a boolean.  In such cases, if message passing cannot work, please use WaitableEvent instead.

## Lock
The Lock class implements a mutual exclusion lock, or mutex for short. `A mutex is used to permit only one thread at a time to have exclusive access to some resource`, which is typically some variable or data structure. Mutexes are so common that many words have been coined to describe their operation.

{% highlight c++ %}
// A convenient wrapper for an OS specific critical section.  The only real
// intelligence in this class is in debug mode for the support for the
// AssertAcquired() method.
class BASE_EXPORT Lock {
 public:
  Lock() : lock_() {}
  ~Lock() {}
  void Acquire() { lock_.Lock(); }
  void Release() { lock_.Unlock(); }

  // If the lock is not held, take it and return true. If the lock is already
  // held by another thread, immediately return false. This must not be called
  // by a thread already holding the lock (what happens is undefined and an
  // assertion may fail).
  bool Try() { return lock_.Try(); }
  //...
};


// A helper class that acquires the given Lock while the AutoLock is in scope.
class AutoLock {
 public:
  struct AlreadyAcquired {};

  explicit AutoLock(Lock& lock) : lock_(lock) {
    lock_.Acquire();
  }

  AutoLock(Lock& lock, const AlreadyAcquired&) : lock_(lock) {
    lock_.AssertAcquired();
  }

  ~AutoLock() {
    lock_.AssertAcquired();
    lock_.Release();
  }

 private:
  Lock& lock_;
  DISALLOW_COPY_AND_ASSIGN(AutoLock);
};
{% endhighlight %}


## Condition variables
Condition variables are a means for **blocking a thread until some condition has been satisfied**.   

* Viewed in isolation, a condition variable allows threads to block and to be woken by other threads. 
* However, condition variables are designed to be used in a specific way; `a condition variable interacts with a mutex to make it easy to wait for an arbitrary condition on state protected by the mutex`. 
* Chrome's C++ condition variables have type ConditionVariable.

{% highlight c++ %}
class BASE_EXPORT ConditionVariable {
 public:
  // Construct a cv for use with ONLY one user lock.
  explicit ConditionVariable(Lock* user_lock);

  ~ConditionVariable();

  // Wait() releases the caller's critical section atomically as it 
  // starts to sleep, and the reacquires it when it is signaled.
  void Wait();
  void TimedWait(const TimeDelta& max_time);

  // Broadcast() revives all waiting threads.
  void Broadcast();
  // Signal() revives one waiting thread.
  void Signal();

 private:

#if defined(OS_WIN)
  ConditionVarImpl* impl_;
#elif defined(OS_POSIX)
  pthread_cond_t condition_;
  pthread_mutex_t* user_mutex_;
#if !defined(NDEBUG)
  // Needed to adjust shadow lock state on wait.
  base::Lock* user_lock_;     
#endif

#endif

  DISALLOW_COPY_AND_ASSIGN(ConditionVariable);
};
{% endhighlight %}


Suppose that a thread is to wait for some boolean expression cond_expr to become true, where the state associated with cond_expr is protected by Lock mu. The programmer would write:

{% highlight c++ %}
// Waiter
mu.Acquire();
while (!cond_expr) {
cv.Wait();  // mu was passed to cv's constructor
}
// cond_expr now holds
...
mu.Release();
{% endhighlight %}

The Wait() call atomically unlocks mu (which the thread must hold), and blocks on the condition variable cv. When another thread signals the condition variable, the thread will reacquire the mu, and go around the mandatory while-loop to recheck cond_expr.

Another thread that makes cond_expr true might execute:

{% highlight c++ %}
// Waker
mu.Acquire();
Make_cond_expr_True();
// cond_expr now holds
cv.Signal();
mu.Release();
{% endhighlight %}

The call to Signal() wakes at least one of the threads waiting on cv. Many threads may be blocked on a condition variable at any given time; **if it makes sense to wake more than one such thread Broadcast() can be used**. (However, this may lead to contention and poor performance if all waiting threads use the same lock; a possibly better approach to getting a lot of threads out of Wait() is to have each thread (upon exiting Wait()) call Signal() to free up another Wait()ing thread.)  

A single condition variable can be used by threads waiting for different conditions. However, in this case, Broadcast() must be used when any of the conditions becomes true, because the ConditionVariable implementation cannot otherwise guarantee to wake the correct thread. **It can be more efficient to use one condition variable for each different condition**; *any number of condition variables can be used with a single mutex.*


## Waitable Event
A WaitableEvent can be a useful thread synchronization tool when you want to allow one thread to wait for another thread to finish some work. For non-Windows systems, this can only be used from within a single address space.  

* Use a WaitableEvent when you would otherwise use a Lock + ConditionVariable to protect a simple boolean value.  
* NOTE: On Windows, this class provides a subset of the functionality afforded by a Windows event object.  This is intentional.  If you are writing Windows specific code and you need other features of a Windows event, then you might be better off just using an Windows event directly.

{% highlight c++ %}  
class BASE_EXPORT WaitableEvent {
 public:
  // If manual_reset is true, then to set the event state to non-signaled, a
  // consumer must call the Reset method.  If this parameter is false, then the
  // system automatically resets the event state to non-signaled after a single
  // waiting thread has been released.
  WaitableEvent(bool manual_reset, bool initially_signaled);

  ~WaitableEvent();

  // Put the event in the un-signaled state.
  void Reset();

  // Put the event in the signaled state.  Causing any thread blocked on Wait
  // to be woken up.
  void Signal();

  // Returns true if the event is in the signaled state, else false.  If this
  // is not a manual reset event, then this test will cause a reset.
  bool IsSignaled();

  // Wait indefinitely for the event to be signaled.
  void Wait();

  // Wait up until max_time has passed for the event to be signaled.  Returns
  // true if the event was signaled.  If this method returns false, then it
  // does not necessarily mean that max_time was exceeded.
  bool TimedWait(const TimeDelta& max_time);
  // ...
  
private:
  DISALLOW_COPY_AND_ASSIGN(WaitableEvent);
};
{% endhighlight %}

## Reference
[http://www.chromium.org/developers/lock-and-condition-variable](http://www.chromium.org/developers/lock-and-condition-variable){: target="_blank"}



