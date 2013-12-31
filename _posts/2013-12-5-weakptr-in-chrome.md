---
layout: article
title: Chrome - WeakPtr
category: chrome
---
*WeakPtr is normally used to avoid recursive reference, this article introduce the use of `WeakPtr` and `WeakPtrFactory` in chrome source code.*


* **Weak pointers** are pointers to an object that **do not affect its lifetime**, and which may be invalidated (i.e. reset to NULL) by the object, or its owner, at any time, most commonly when the object is about to be deleted.

* **Weak pointers are useful when an object needs to be accessed safely by one or more objects other than its owner**, and those callers can cope with the object vanishing and e.g. tasks posted to it being silently dropped. Reference-counting such an object would complicate the ownership graph and make it harder to reason about the object's lifetime.

## Normal Usage Example:
{% highlight c++ %}
  class Controller {
   public:
    void SpawnWorker() {
      Worker::StartNew(weak_factory_.GetWeakPtr());
    }
    void WorkComplete(const Result& result) { ... }
   private:
    WeakPtrFactory<Controller> weak_factory_;
  };

  class Worker {
   public:
    static void StartNew(const WeakPtr<Controller>& controller) {
      Worker* worker = new Worker(controller);
      // Kick off asynchronous processing...
    }
   private:
    Worker(const WeakPtr<Controller>& controller)
        : controller_(controller) {}
    void DidCompleteAsynchronousProcessing(const Result& result) {
      if (controller_)
        controller_->WorkComplete(result);
    }
    WeakPtr<Controller> controller_;
  };
{% endhighlight %}

* With this implementation a caller may use SpawnWorker() to dispatch multiple Workers and subsequently delete the Controller, without waiting for all Workers to have completed.

* Weak pointers **must always be dereferenced and invalidated on the same thread** otherwise checking the pointer would be racey.  WeakPtrFactory enforces this by binding itself to the current thread when a WeakPtr is first created and un-binding only when those pointers are invalidated.  WeakPtrs may still be handed off to other threads, however, so long as they are only actually dereferenced on the originating thread. This includes posting tasks to the thread using base::Bind() to invoke a method on the object via the WeakPtr.

*Calling SupportsWeakPtr::DetachFromThread() can work around the limitations above and cancel the thread binding of the object and all WeakPtrs pointing to it, but it's `not recommended` and unsafe.*



## WeakPtr Class:
* The WeakPtr class holds a weak reference to T\*, which is created by **WeakPtrFactory**, with the reference auto managed. This class is designed to be used like a normal pointer.
* You should **always null-test** an object of this class before using it or invoking a method that may result in the underlying object being destroyed.

{% highlight c++ %}
// EXAMPLE:
class Foo { ... };
WeakPtr<Foo> foo;
if (foo)
  foo->method();
{% endhighlight %}

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
* This is helpful if you only need weak pointers within the implementation of a class.
* This class is also useful when working with primitive types. For example, you could have a WeakPtrFactory&lt;bool> that is used to pass around a weak reference to a bool.

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



