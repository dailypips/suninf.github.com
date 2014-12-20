---
layout: article
title: Python之class与json自动转化
category: python
---
*对象自动序列化常常是很有用的，因为这样实现了字符串与class结构之间的无缝转换，很多客户端与服务端的交互都是类似json这样的格式传输的，转换的自动化就显的很有价值。*
 
{% highlight python %}
# encoding: utf-8
import json
 
# 支持自动序列化的基类
class archive_json( object ):
    def from_json(self, json_str):
        obj = json.loads(json_str)
        for key in vars(self):
            if key in obj:
                setattr(self, key, obj[key])
 
    def to_json(self):
        return json.dumps( vars(self) )
 
# 测试类结构
class MyClass( archive_json ):
    def __init__(self):
        self.name = u''
        self.degree = 0
        self.scores = []
 
def main():
    t = MyClass()
    t.name = u'zhenshan'
    t.degree = 6
    t.scores = [95,100,90]
 
    # class to json
    json_str = t.to_json()
    print json_str
 
    # json to class
    u = MyClass()
    u.from_json( json_str )
    print vars(u)
 
if __name__ == '__main__':
    main()
 
# 输出：
{"name": "zhenshan", "degree": 6, "scores": [95, 100, 90]}
{'name': u'zhenshan', 'degree': 6, 'scores': [95, 100, 90]}
{% endhighlight %}
 
说明：

1. class要支持自动序列化，只要继承自archive_json即可
2. archive_json的实现非常简单：
    - 依赖于vars()内建函数，vars(self)返回当前对象的成员数据的字典，这恰好对应于json的object。
    - 依赖于setattr()内建函数，这使得属性可以通过字符串名来匹配，这对自动化是非常有利的。 