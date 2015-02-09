---
layout: article
title: Bash Shell常用命令
category: tools
---

本文整理一些在linux或mac的shell命令及脚本的使用。

## 基本操作

- `mkdir -p 目录名`

会递归的创建所有的目录，如：`mkdir -p test1/test2/test3`


- 显示环境变量 `echo $PATH`

echo表示“显示”，$表示后面接的是变量

- `ls`

-a：全部文件  
-d：仅列出目录本身  
-l：列出长数据串，包含文件的属性  
-t：按时间排序  
-S：按文件大小排序  
-r：将排序结果反向输出  
-R：与子目录一起列出来  

- `cp` 

-a：相当于-pdr  
-d：源文件如果是连接文件（link file），复制连接文件属性而非文件本身  
-f：不询问用户，强制复制  
-i：若目标文件已经存在，会提示  
-l：建立硬连接（hard link）的连接文件，而非文件本身  
-p：文件属性也一起复制  
-r：递归复制，用于目录的复制  
-s：复制成符号连接（symbolic link）文件，即快捷方式  
-u：若目标文件比源文件旧，则更新目标文件  


- `which cmd` 查找可执行文件

- `type` cmd 查看命名是系统内置的，还是外部的

- `file` 查看文件基本信息

- 设置别名`alias`：

~~~~
alias ll='ls -l'
alias la='ls -a'
alias vi='vim'
alias grep="grep --color=auto"
~~~~


- **关于变量的获取与设置**

获取：  
`$variable`：获取变量值（用echo可以显示出来，未设置的变量，echo显示为空）

设置：  
`myname=suninf`

规则：  

1. 变量与变量内容以等号“=”连接
2. 等号两边不能有空格
3. 变量内容如果有空格，可以使用双引号"包起来，双引号内的特殊字符可以保持变量特性
4. 可以使用转义字符\来转义特殊字符，如“$,\,空格”等
5. 若变量为扩展变量内容，需要以双引号和$变量名称来累加内容，如："$PATH:/home"
6. 取消变量：unset 变量名
7. export变量到环境变量，则该变量可以继续在子程序中使用

- env 查看系统环境变量

- set 可以查看当前进程可用的环境变量



## 其他操作

### 创建shell脚本文件

一般创建.sh文件，文件开始指明是shell脚本，例子：

~~~~
#!/bin/bash

for line in `cat data.txt` 
do 
    echo $line 
done
~~~~

再添加可执行权限  
`chmod +x file.sh`