---
layout: article
title: Package in java
category: java
---
本文介绍Eclipse中Java包的建立与使用。

## package包的建立与使用

### 包的创建

- Eclipse中选择工程，然后菜单 [文件] - [新建] - [包]，即可创建包，比如suninf.archive  
![](http://www.suninf.net/images/articles/new_jar.png){: style="width:90%;"}

- 然后可以增加类，创建类时还可以指定包名，Eclipse会自动把类放置到指定包路径下  
![](http://www.suninf.net/images/articles/new_class_in_jar.png){: style="width:90%;"}

### 包的使用

Eclipse中，一个工程要使用其他工程的包，可以配置下项目依赖即可：

- 工程右键菜单 [属性] – [java构建路径] – [项目]，然后添加项目依赖。
- 这样当前工程就可以使用所依赖的工程的包层次和类了。

![](http://www.suninf.net/images/articles/project_jar_config.png){: style="width:90%;"}

## jar包的使用

### 导出jar包

要导出jar的工程右键：[导出] – [`java | jar文件`] – [jar导出目标]，即可生成jar文件。


### 工程使用jar包

工程右键菜单 [属性] – [java构建路径] – [库]，然后添加jar包即可，并且可以配置jar包的源码，这样在项目资源管理器处，可以直接点击查看相应的源码。



