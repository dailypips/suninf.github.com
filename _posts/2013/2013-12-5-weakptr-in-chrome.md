---
layout: article
title: WeakPtr in chrome
category: chrome
---
WeakPtr is normally used to avoid recursive reference, this article introduce the use of `WeakPtr` and `WeakPtrFactory` in chrome source code.

- **Weak pointers** are pointers to an object that **do not affect its lifetime**, and which may be invalidated (i.e. reset to NULL) by the object, or its owner, at any time, most commonly when the object is about to be deleted.

- **Weak pointers are useful when an object needs to be accessed safely by one or more objects other than its owner**, and those callers can cope with the object vanishing and e.g. tasks posted to it being silently dropped. Reference-counting such an object would complicate the ownership graph and make it harder to reason about the object's lifetime.

- Weak pointers **must always be dereferenced and invalidated on the same thread**, otherwise checking the pointer would be racey. WeakPtrFactory enforces this by binding itself to the current thread when a WeakPtr is first created and un-binding only when those pointers are invalidated.  WeakPtrs may still be handed off to other threads, however, so long as they are only actually dereferenced on the originating thread. This includes posting tasks to the thread using base::Bind() to invoke a method on the object via the WeakPtr.


## WeakPtr Class:

- The WeakPtr class holds a weak reference to T\*, which is created by **WeakPtrFactory**, with the reference auto managed. This class is designed to be used like a normal pointer.
- You should **always null-test** an object of this class before using it or invoking a method that may result in the underlying object being destroyed.

{% highlight c++ %}
// WeakPtr Implement
template <typename T>
class WeakPtr : public internal::WeakPtrBase {
 public:
  WeakPtr() : ptr_(NULL) {
  }

  // Allow conversion from U to T provided U "is a" T. Note that this
  // is separate from the (implicit) copy constructor.
  template <typename U>
  WeakPtr(const WeakPtr<U>& other)
    : WeakPtrBase(other)
    , ptr_(other.ptr_) {
  }

  T* get() const { return ref_.is_valid() ? ptr_ : NULL; }
  operator T*() const { return get(); }

  T& operator*() const {
    DCHECK(get() != NULL);
    return *get();
  }
  T* operator->() const {
    DCHECK(get() != NULL);
    return get();
  }

  void reset() {
    ref_ = internal::WeakReference();
    ptr_ = NULL;
  }

 private:
  friend class internal::SupportsWeakPtrBase;
  template <typename U> friend class WeakPtr;
  friend class SupportsWeakPtr<T>;
  friend class WeakPtrFactory<T>;

  WeakPtr(const internal::WeakReference& ref, T* ptr)
      : WeakPtrBase(ref),
        ptr_(ptr) {
  }

  // This pointer is only valid when ref_.is_valid() is true.
  // Otherwise, its value is undefined (as opposed to NULL).
  T* ptr_;
};
{% endhighlight %}


## WeakPtrFactory Class:
A class may be composed of a WeakPtrFactory and thereby **control how it exposes weak pointers to itself**.

- This is helpful if you only need weak pointers within the implementation of a class.
- This class is also useful when working with primitive types. For example, you could have a WeakPtrFactory&lt;bool> that is used to pass around a weak reference to a bool.

{% highlight c++ %}
// WeakPtrFactory implement
template <class T>
class WeakPtrFactory {
 public:
  explicit WeakPtrFactory(T* ptr) : ptr_(ptr) {
  }

  ~WeakPtrFactory() {
    ptr_ = NULL;
  }

  WeakPtr<T> GetWeakPtr() {
    DCHECK(ptr_);
    return WeakPtr<T>(weak_reference_owner_.GetRef(), ptr_);
  }

  // Call this method to invalidate all existing weak pointers.
  void InvalidateWeakPtrs() {
    DCHECK(ptr_);
    weak_reference_owner_.Invalidate();
  }

  // Call this method to determine if any weak pointers exist.
  bool HasWeakPtrs() const {
    DCHECK(ptr_);
    return weak_reference_owner_.HasRefs();
  }

  // Indicates that this object will be used on another thread.
  // Do not use this in new code.
  void DetachFromThread() {
    DCHECK(ptr_);
    weak_reference_owner_.DetachFromThread();
  }

 private:
  internal::WeakReferenceOwner weak_reference_owner_;
  T* ptr_;
  DISALLOW_IMPLICIT_CONSTRUCTORS(WeakPtrFactory);
};
{% endhighlight %}


## SupportsWeakPtr

- A class T may extend from `SupportsWeakPtr<T>` to let others take weak pointers to it. **This avoids the class itself implementing boilerplate to dispense weak pointers.** 
- However, since SupportsWeakPtr's destructor **won't invalidate weak pointers to the class until after the derived class' members have been destroyed**, its use can lead to subtle use-after-destroy issues.

{% highlight c++ %}
template <class T>
class SupportsWeakPtr : public internal::SupportsWeakPtrBase {
 public:
  SupportsWeakPtr() {}

  WeakPtr<T> AsWeakPtr() {
    return WeakPtr<T>(weak_reference_owner_.GetRef(), static_cast<T*>(this));
  }

 protected:
  ~SupportsWeakPtr() {}

 private:
  internal::WeakReferenceOwner weak_reference_owner_;
  DISALLOW_COPY_AND_ASSIGN(SupportsWeakPtr);
};
{% endhighlight %}


## base::AsWeakPtr

{% highlight c++ %}
template <typename Derived>
WeakPtr<Derived> AsWeakPtr(Derived* t) {
  return internal::SupportsWeakPtrBase::StaticAsWeakPtr<Derived>(t);
}
{% endhighlight %}

base::AsWeakPtr uses type deduction to safely return a `WeakPtr<Derived>` when Derived doesn't directly extend `SupportsWeakPtr<Derived>`, instead it extends a Base that extends `SupportsWeakPtr<Base>`

### Example

{% highlight c++ %}
class Base : public base::SupportsWeakPtr<Producer> {};
class Derived : public Base {};

Derived derived;
base::WeakPtr<Derived> ptr = base::AsWeakPtr(&derived);
{% endhighlight %}


## Samples:

### Use base::WeakPtrFactory as member

- Use a base::WeakPtrFactory class member to create WeakPtrs
- Use a base::Thread to PostTask with Weakptrs

{% highlight c++ %}
#include "base/memory/weak_ptr.h"
#include "base/threading/thread.h"
#include "base/bind.h"

class WeakPtrTest {
public:
  WeakPtrTest() 
    : weak_ptr_factory_(this) 
    , thread_("test") {
      base::Thread::Options options;
      options.message_loop_type = base::MessageLoop::TYPE_DEFAULT;
      thread_.StartWithOptions( options );
  }

  ~WeakPtrTest() {
    weak_ptr_factory_.InvalidateWeakPtrs();
  }

  void func() {
    thread_.message_loop()->PostTask(FROM_HERE, 
      base::Bind(&WeakPtrTest::callback, weak_ptr_factory_.GetWeakPtr()) );
  }

private:
  void callback() {
    // May not be called if this class has been invalid 
    // do something
  }

private:
  base::Thread thread_;
  base::WeakPtrFactory<WeakPtrTest> weak_ptr_factory_;
};

WeakPtrTest * g_test = NULL;

void BaseTestFunc() {
  g_test = new WeakPtrTest;
  g_test->func();
}
{% endhighlight %}

### Inherit from  `SupportsWeakPtr<T>`

{% highlight c++ %}
class WeakPtrTest : base::SupportsWeakPtr<WeakPtrTest> {
public:
  WeakPtrTest() 
    : thread_("test") {
      base::Thread::Options options;
      options.message_loop_type = base::MessageLoop::TYPE_DEFAULT;
      thread_.StartWithOptions( options );
  }

  void func() {
    thread_.message_loop()->PostTask(FROM_HERE, 
      base::Bind(&WeakPtrTest::callback, AsWeakPtr()) );
  }

private:
  void callback() {
    // May not be called if this class has been invalid 
    // do something
  }

private:
  base::Thread thread_;
};
{% endhighlight %}