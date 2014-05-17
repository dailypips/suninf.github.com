---
layout: article
title: Notification Registrar in chrome
category: chrome
description: Event register and callback are very common and useful in an app, chrome implements an simple, uncoupled and smart Notification Mechanism.
---
*Event register and callback are very common and useful in an app, chrome implements an simple, uncoupled and smart Notification Mechanism.*

## NotificationRegistrar
* This class is designed to register for notifications and ensures that all registered notifications are unregistered when the class is destroyed.
* The intended use is that you make a NotificationRegistrar member in your class and use it to register your notifications instead of going through the notification service directly. It will automatically unregister them for you.

{% highlight c++ %}
// callback interface
class CONTENT_EXPORT NotificationObserver {
 public:
  virtual void Observe(int type,
                       const NotificationSource& source,
                       const NotificationDetails& details) = 0;

 protected:
  virtual ~NotificationObserver() {}
};

// notification registrar
class CONTENT_EXPORT NotificationRegistrar :
    NON_EXPORTED_BASE(public base::NonThreadSafe) {
 public:
  // This class must not be derived from (we don't have a virtual destructor so
  // it won't work). Instead, use it as a member in your class.
  NotificationRegistrar();
  ~NotificationRegistrar();

  // Wrappers around NotificationService::[Add|Remove]Observer.
  void Add(NotificationObserver* observer,
           int type,
           const NotificationSource& source);
  void Remove(NotificationObserver* observer,
              int type,
              const NotificationSource& source);

  // Unregisters all notifications.
  void RemoveAll();

  // Returns true if no notifications are registered.
  bool IsEmpty() const;

  // Returns true if there is already a registered notification with the
  // specified details.
  bool IsRegistered(NotificationObserver* observer,
                    int type,
                    const NotificationSource& source);

 private:
  struct Record;

  // We keep registered notifications in a simple vector. This means we'll do
  // brute-force searches when removing them individually, but individual
  // removal is uncommon, and there will typically only be a couple of
  // notifications anyway.
  typedef std::vector<Record> RecordVector;

  // Lists all notifications we're currently registered for.
  RecordVector registered_;

  DISALLOW_COPY_AND_ASSIGN(NotificationRegistrar);
};
{% endhighlight %}


## Example
An example about how to use notification registrar.

{% highlight c++ %}
#include <string>
#include "base/at_exit.h"
#include "content/public/browser/notification_observer.h"
#include "content/public/browser/notification_registrar.h"
#include "content/public/browser/notification_service.h"
#include "content/public/browser/notification_source.h"

namespace content {

enum MyEventType 
{
  MY_EVENT_INT,
  MY_EVENT_STRING,

  MY_EVENT_TOTAL
};

class MyEventObserver : NotificationObserver
{
public:
  MyEventObserver()
  {
    registrar_.Add( this, 
      MY_EVENT_INT, NotificationService::AllSources() );

    registrar_.Add( this, 
      MY_EVENT_STRING, NotificationService::AllSources() );
  }

  virtual void Observe(int type, 
    const NotificationSource& source, 
    const NotificationDetails& details) 
  {
    switch(type) {
    case MY_EVENT_INT:
      {
        int * piVal = Source<int>(source).ptr();
        int n = *piVal;
      }

      break;

    case MY_EVENT_STRING:
      {
        std::string * pstrVal = Source<std::string>(source).ptr();
        std::string str = *pstrVal;
      }

      break;
    }
  }

private:
  NotificationRegistrar registrar_;
};

}// namespace content

// test in chrome code
// Observer and reg
MyEventObserver myEvent;

// Notify
int iVal = 100;
NotificationService::current()->Notify(
	MY_EVENT_INT,
	Source<int>(&iVal),
	Details<int>(nullptr));

std::string strVal = "string";
NotificationService::current()->Notify(
	MY_EVENT_STRING,
	Source<std::string>(&strVal),
	Details<int>(nullptr));

{% endhighlight %}



