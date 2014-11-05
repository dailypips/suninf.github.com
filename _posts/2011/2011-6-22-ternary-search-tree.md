---
layout: article
title: Ternary Search Tree 三元状态树
category: algorithm
description: 基于三元状态树( Ternary Search Trees )实现的tst_map
---

*基于三元状态树( Ternary Search Trees )实现的tst_map，结合二叉树的空间效率和digital tries的时间效率，是非常有效的基于字符串作为key的关联容器。*

三元状态树是特殊的trie树，每个节点存储一个字符，并且最多可有3个子节点。
 
- 源码：  
[https://github.com/suninf/tst_map/blob/master/tst_map.h](https://github.com/suninf/tst_map/blob/master/tst_map.h)


- wiki：  
[http://en.wikipedia.org/wiki/Ternary_search_tree](http://en.wikipedia.org/wiki/Ternary_search_tree)

 
- 论文（实现原理）：  
[http://www.drdobbs.com/database/ternary-search-trees/184410528](http://www.drdobbs.com/database/ternary-search-trees/184410528)


