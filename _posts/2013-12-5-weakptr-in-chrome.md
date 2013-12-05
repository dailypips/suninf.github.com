---
layout: article
title: Chrome - WeakPtr
category: chrome
---
*This article introduce the use of `WeakPtr` and `WeakPtrFactory` in chrome source code.*


* Weak pointers are pointers to an object that **do not affect its lifetime**, and which may be invalidated (i.e. reset to NULL) by the object, or its owner, at any time, most commonly when the object is about to be deleted.

* Weak pointers are useful when an object needs to be accessed safely by one or more objects other than its owner, and those callers can cope with the object vanishing and e.g. tasks posted to it being silently dropped. Reference-counting such an object would complicate the ownership graph and make it harder to reason about the object's lifetime.

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

*Calling SupportsWeakPtr::DetachFromThread() can work around the limitations above and cancel the thread binding of the object and all WeakPtrs pointing to it, but it's **not recommended** and unsafe.*





