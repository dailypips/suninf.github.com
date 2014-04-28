---
layout: article
title: Chrome - Thread / MessageLoop
category: chrome
description: Threads are very useful in application to deal with multi-thread problems, and chrome wrapped a series of excellent classes - base::Thread, MessageLoop and so on.
---
*Threads are very useful in application to deal with multi-thread problems, and chrome wrapped a series of excellent classes: `base::Thread`, MessageLoop and so on.*

## Example
{% highlight c++ %}
// Init thread
base::Thread* g_cache_thread = NULL;
g_cache_thread = new base::Thread("cache");
g_cache_thread->StartWithOptions(
    base::Thread::Options(MessageLoop::TYPE_IO, 0));

// Post task
g_cache_thread->message_loop_proxy()->PostTask( FROM_HERE,
    base::Bind(&ThisClass::SomeFunc, this, args) );
{% endhighlight %}


## MessageLoop
* A MessageLoop is used to process events for a particular thread. There is at most one MessageLoop instance per thread.
* Events include at a minimum Task instances submitted to PostTask and its variants. Depending on the type of message pump used by the MessageLoop, other events such as UI messages may be processed.
* On Windows APC calls (as time permits) and signals sent to a registered set of HANDLEs may also be processed.

NOTE:
MessageLoop has task reentrancy protection. This means that if a task is being processed, a second task cannot start until the first task is finished. Reentrancy can happen when processing a task, and an inner message pump is created. That inner pump then processes native messages which could implicitly start an inner task.  Inner message pumps are created with dialogs (DialogBox), common dialogs (GetOpenFileName), OLE functions (DoDragDrop), printer functions (StartDoc) and *many* others.

Sample workaround when inner task processing is needed:

    HRESULT hr;
    {
      MessageLoop::ScopedNestableTaskAllower allow(MessageLoop::current());
      hr = DoDragDrop(...); // Implicitly runs a modal message loop.
    }
    // Process |hr| (the result returned by DoDragDrop()).


Please be SURE your task is reentrant (nestable) and all global variables are stable and accessible before calling SetNestableTasksAllowed(true).


### MessageLoop class
 A **MessageLoop** has a particular type, which indicates the set of asynchronous events it may process in addition to tasks and timers.

* **TYPE_DEFAULT**

    This type of ML only supports tasks and timers.

* **TYPE_UI**

    This type of ML also supports native UI events (e.g., Windows messages).
    See also MessageLoopForUI.

* **TYPE_IO**

    This type of ML also supports asynchronous IO.
    See also MessageLoopForIO.

{% highlight c++ %}
enum Type
{
    TYPE_DEFAULT,
    TYPE_UI,
    TYPE_IO
};
{% endhighlight %}


`The "PostTask" family of methods` call the task's Run method asynchronously from within a message loop at some point in the future.

* With the PostTask variant, tasks are invoked in FIFO order, inter-mixed with normal UI or IO event processing.  With the PostDelayedTask variant, tasks are called after at least approximately 'delay_ms' have elapsed.
* The NonNestable variants work similarly except that they promise never to dispatch the task from a nested invocation of MessageLoop::Run. Instead, such tasks get deferred until the top-most MessageLoop::Run is executing.
* The MessageLoop takes ownership of the Task, and deletes it after it has been Run(). PostTask(from_here, task) is equivalent to PostDelayedTask(from_here, task, 0).
* The TryPostTask is meant for the cases where the calling thread cannot block. If posting the task will block, the call returns false, the task is not posted but the task is consumed anyways.
* These methods may be called on any thread.  The Task will be invoked on the thread that executes MessageLoop::Run().

{% highlight c++ %}
  void PostTask(
      const tracked_objects::Location& from_here,
      const base::Closure& task);

  bool TryPostTask(
      const tracked_objects::Location& from_here,
      const base::Closure& task);

  void PostDelayedTask(
      const tracked_objects::Location& from_here,
      const base::Closure& task,
      base::TimeDelta delay);

  void PostNonNestableTask(
      const tracked_objects::Location& from_here,
      const base::Closure& task);

  void PostNonNestableDelayedTask(
      const tracked_objects::Location& from_here,
      const base::Closure& task,
      base::TimeDelta delay);
{% endhighlight %}


### MessageLoopForUI class
MessageLoopForUI extends MessageLoop with methods that are particular to a MessageLoop instantiated with TYPE_UI.

This class is typically used like so:
   MessageLoopForUI::current()->...call some method...

{% highlight c++ %}
class BASE_EXPORT MessageLoopForUI : public MessageLoop {
 public:
  typedef base::MessagePumpForUI::MessageFilter MessageFilter;

  MessageLoopForUI() : MessageLoop(TYPE_UI) {
  }

  // Returns the MessageLoopForUI of the current thread.
  static MessageLoopForUI* current() {
    MessageLoop* loop = MessageLoop::current();
    DCHECK(loop);
    DCHECK_EQ(MessageLoop::TYPE_UI, loop->type());
    return static_cast<MessageLoopForUI*>(loop);
  }

  void DidProcessMessage(const MSG& message);


  void AddObserver(Observer* observer);
  void RemoveObserver(Observer* observer);

  // Plese see MessagePumpForUI for definitions of this method.
  void SetMessageFilter(scoped_ptr<MessageFilter> message_filter) {
    pump_ui()->SetMessageFilter(message_filter.Pass());
  }

 protected:
  base::MessagePumpForUI* pump_ui() {
    return static_cast<base::MessagePumpForUI*>(pump_.get());
  }
};
{% endhighlight %}


### MessageLoopForIO class
MessageLoopForIO extends MessageLoop with methods that are particular to a MessageLoop instantiated with TYPE_IO.

This class is typically used like so:
   MessageLoopForIO::current()->...call some method...

{% highlight c++ %}
class BASE_EXPORT MessageLoopForIO : public MessageLoop {
 public:
  typedef base::MessagePumpForIO::IOHandler IOHandler;
  typedef base::MessagePumpForIO::IOContext IOContext;
  typedef base::MessagePumpForIO::IOObserver IOObserver;

  MessageLoopForIO() : MessageLoop(TYPE_IO) {
  }

  // Returns the MessageLoopForIO of the current thread.
  static MessageLoopForIO* current() {
    MessageLoop* loop = MessageLoop::current();
    DCHECK_EQ(MessageLoop::TYPE_IO, loop->type());
    return static_cast<MessageLoopForIO*>(loop);
  }

  void AddIOObserver(IOObserver* io_observer) {
    pump_io()->AddIOObserver(io_observer);
  }

  void RemoveIOObserver(IOObserver* io_observer) {
    pump_io()->RemoveIOObserver(io_observer);
  }

  // Please see MessagePumpWin for definitions of these methods.
  void RegisterIOHandler(HANDLE file, IOHandler* handler);
  bool RegisterJobObject(HANDLE job, IOHandler* handler);
  bool WaitForIOCompletion(DWORD timeout, IOHandler* filter);

 protected:
  base::MessagePumpForIO* pump_io() {
    return static_cast<base::MessagePumpForIO*>(pump_.get());
  }
};
{% endhighlight %}



## Thread
* A simple thread abstraction that establishes a MessageLoop on a new thread. The consumer uses the MessageLoop of the thread to cause code to execute on the thread.
* When this object is destroyed the thread is terminated.  All pending tasks queued on the thread's message loop will run to completion before the thread is terminated.

 *WARNING! SUBCLASSES MUST CALL Stop() IN THEIR DESTRUCTORS!  See ~Thread().*

After the thread is stopped, the destruction sequence is:

1. Thread::CleanUp()
2. MessageLoop::~MessageLoop
3. MessageLoop::DestructionObserver::WillDestroyCurrentMessageLoop

{% highlight c++ %}
class BASE_EXPORT Thread : PlatformThread::Delegate {
 public:
  struct Options {
    Options() : message_loop_type(MessageLoop::TYPE_DEFAULT), stack_size(0) {}
    Options(MessageLoop::Type type, size_t size)
        : message_loop_type(type), stack_size(size) {}

    MessageLoop::Type message_loop_type;
    size_t stack_size;
  };

  explicit Thread(const char* name);

  // Destroys the thread, stopping it if necessary.
  //
  // NOTE: ALL SUBCLASSES OF Thread MUST CALL Stop() IN THEIR DESTRUCTORS (or
  // guarantee Stop() is explicitly called before the subclass is destroyed).
  // This is required to avoid a data race between the destructor modifying the
  // vtable, and the thread's ThreadMain calling the virtual method Run().  It
  // also ensures that the CleanUp() virtual method is called on the subclass
  // before it is destructed.
  virtual ~Thread();

#if defined(OS_WIN)
  // Causes the thread to initialize COM.
  void init_com_with_mta(bool use_mta) {
    DCHECK(!started_);
    com_status_ = use_mta ? MTA : STA;
  }
#endif

  bool Start();

  bool StartWithOptions(const Options& options);

  // Signals the thread to exit and returns once the thread has exited.
  // NOTE: If you are a consumer of Thread, it is not necessary to call this
  // before deleting your Thread objects, as the destructor will do it.
  // IF YOU ARE A SUBCLASS OF Thread, YOU MUST CALL THIS IN YOUR DESTRUCTOR.
  void Stop();

  // Returns the message loop for this thread.  Use the MessageLoop's
  // PostTask methods to execute code on the thread.  This only returns
  // non-null after a successful call to Start.  After Stop has been called,
  // this will return NULL.
  MessageLoop* message_loop() const { return message_loop_; }

  // Returns a MessageLoopProxy for this thread.  Use the MessageLoopProxy's
  // PostTask methods to execute code on the thread.  This only returns
  // non-NULL after a successful call to Start. After Stop has been called,
  // this will return NULL. Callers can hold on to this even after the thread
  // is gone.
  scoped_refptr<MessageLoopProxy> message_loop_proxy() const {
    return message_loop_ ? message_loop_->message_loop_proxy() : NULL;
  }

  // Returns the name of this thread (for display in debugger too).
  const std::string& thread_name() const { return name_; }

  // The native thread handle.
  PlatformThreadHandle thread_handle() { return thread_; }

  // The thread ID.
  PlatformThreadId thread_id() const { return thread_id_; }

  // Returns true if the thread has been started, and not yet stopped.
  bool IsRunning() const;

  //...
}
{% endhighlight %}