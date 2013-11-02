---
layout: article
title: Chrome - Bind / Callback
category: chrome
---
This article introduce the usage of base::Bind and base::Callback.
* The templated Callback class is a generalized function object. Together with the Bind() function in bind.h, they provide a type-safe method for performing `partial application of functions`.
* The Callback objects themselves should be passed by const-reference, and stored by copy. They internally store their state via a refcounted class and thus do not need to be deleted. The reason to pass via a const-reference is to avoid unnecessary AddRef/Release pairs to the internal state.

##Bind
###Binding a bare function

###Binding a member function




