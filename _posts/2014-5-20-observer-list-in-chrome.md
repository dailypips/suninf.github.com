---
layout: article
title: ObserverList in chrome
category: chrome
description: ObserverList is a container for a list of observers, it is an easy-to-use observer pattern for two related objects.  Unlike a normal STL vector or list, this container can be modified during iteration without invalidating the iterator.
---
*`ObserverList<ObserverType>` is a container for a list of observers, it is an easy-to-use observer pattern for two related objects.  Unlike a normal STL vector or list, this container can be modified during iteration without invalidating the iterator.*

* So, it safely handles the case of an observer removing itself or other observers from the list while observers are being notified.
* If you want to deal with observer_list in multi-thread, just use ObserverListThreadSafe.

## ObserverList
{% highlight c++ %}
template <class ObserverType, bool check_empty = false>
class ObserverList : public ObserverListBase<ObserverType> {
	//...
};

#define FOR_EACH_OBSERVER(ObserverType, observer_list, func)         \
  do {                                                               \
    if ((observer_list).might_have_observers()) {                    \
      ObserverListBase<ObserverType>::Iterator it(observer_list);    \
      ObserverType* obs;                                             \
      while ((obs = it.GetNext()) != NULL)                           \
        obs->func;                                                   \
    }                                                                \
  } while (0)
{% endhighlight %}


## Example  
{% highlight c++ %}
#include "base/observer_list.h"

class MyWidget;

class MyObserver 
{
public:
  MyObserver( MyWidget * widget );

  virtual void OnFoo(MyWidget* w) {
    //...
  }
  virtual void OnBar(MyWidget* w, int x, int y){
    //...
  }
};

class MyWidget {
public:
  void AddObserver(MyObserver* obs) {
    observer_list_.AddObserver(obs);
  }

  void RemoveObserver(MyObserver* obs) {
    observer_list_.RemoveObserver(obs);
  }

  void NotifyFoo() {
    FOR_EACH_OBSERVER(MyObserver, observer_list_, OnFoo(this));
  }

  void NotifyBar(int x, int y) {
    FOR_EACH_OBSERVER(MyObserver, observer_list_, OnBar(this, x, y));
  }

private:
  ObserverList<MyObserver> observer_list_;
};

// implement
MyObserver::MyObserver( MyWidget * widget ) 
{
  widget->AddObserver(this);
}

void Test()
{
  MyWidget widget;
  // two observers
  MyObserver observer1(&widget), observer2(&widget);

  widget.NotifyFoo();
  widget.NotifyBar(3,5);
}  
{% endhighlight %}