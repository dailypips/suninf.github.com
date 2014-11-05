---
layout: article
title: 发布COM组件方式
category: c++
description: 
---

*本文介绍常用的几种发布COM组件的方式。*

## 用注册表来注册组件

借助于注册表来注册组件，这样可以直接通过CoCreateInstance获取接口

### 注册表查找组件的CLSID支持两个路径：

~~~~
	HKCU\Software\Classes\CLSID\{uuid-string}  
	HKCR\CLSID\{uuid-string}
~~~~

当调用CoCreateInstance时，先查找第一个注册表项，如果查找失败，再查找第二项。
 
### 注册信息可以直接在项目注册脚本.rgs文件中查看

如testDLL项目默认生成的test.rhs为：

~~~~
	HKCR
	{
	    NoRemove AppID
	    {
	       '%APPID%' = s 'testDll'
	       'testDll.DLL'
	       {
	           val AppID = s '%APPID%'
	       }
	    }
	}
~~~~
 
也就是说默认是注册到第二个位置HKCR，其实最好将其修改为HKCU下面，因为注册表也是有读写权限的，而HKCR的权限要求比HKCU高。

比如改成：

~~~~
	HKCU
	{
	    NoRemove Software
	    {
	       NoRemove Classes
	       {  
	           NoRemove AppID
	           {
	              '%APPID%' = s 'testDll'
	              'testDll.DLL'
	              {
	                  val AppID = s '%APPID%'
	              }
	           }
	       }
	    }
	}
~~~~
 
### 发布程序时，需要注册对应的组件

- DLL自身知道怎么注册自己的组件信息（rgs文件），并且提供了导出函数注册DllRegisterServer和反注册DllUnregisterServer。
- 另外，windows还提供shell命令`regsvr32 [/u] [/s] *.dll` 的方式注册组件，该命令会调用上述的导出函数。
- 注册当然是根据依赖的方式，主动注册，“我依赖谁，我注册谁”。
 
 
所以下面介绍这两种方式的简单实现：

- 导出函数DllRegisterServer的调用

{% highlight c++ %}
void RegDll_export()
{
    typedef HRESULT (WINAPI * FREG)();
 
    HMODULE hDll = LoadLibrary( L"testDll.dll" );
    if ( hDll )
    {
       FREG lpfunc = (FREG)::GetProcAddress( hDll, "DllRegisterServer" );
       if ( lpfunc )
       {
           lpfunc();
       }
 
       FreeLibrary(hDll);
    }
}
{% endhighlight %}

- 利用regsvr32

{% highlight c++ %}
void RegDll_regsvr32()
{
    STARTUPINFO si;
    PROCESS_INFORMATION pi;
    memset(&si, 0, sizeof(si));
    memset(&pi, 0, sizeof(pi));
    si.cb = sizeof(si);
 
    static const int MAX_PATH_LEN = 1025;
    wchar_t processPath[MAX_PATH_LEN] = {0};
 
    GetCurrentDirectory( MAX_PATH_LEN, processPath ); // 当前路径下
    CString strCmd = L"regsvr32.exe";
    strCmd += L" /s "; // 静默方式
    strCmd += CString("\"") + CString(processPath) + CString("\"") + 
        L"\\testDll.dll" ; // 命令行可能不支持空格路径
    BOOL bOK = CreateProcess( 0, const_cast<LPTSTR>( (LPCTSTR)strCmd ),
       NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi );
    if ( bOK )
    {
       WaitForSingleObject( pi.hProcess, INFINITE );
       ::CloseHandle( pi.hProcess );
       ::CloseHandle( pi.hThread );
    }
}
{% endhighlight %}

### release发布程序时还要注意几个问题：

- 通过depends.exe工具，查看程序直接依赖的动态库，需要的都要放到程序目录
- 查看exe对应的清单文件（release目录下*.manifest），如果有依赖系统的清单文件（如Microsoft.VC80.CRT.manifest），则需要加上。

 
## 借助于manifest免注册机制（替代注册表）

1. 官方称为Reg-free或者SideBySide技术
2. 基本思想：是将注册信息免去注册到注册表，而是直接使用本地的一个manifest文件来按照一定的格式存储组件信息。查找组件的时候，能从该文件中读到对应的信息。参考：[http://msdn.microsoft.com/en-us/library/aa374219(v=VS.85).aspx](http://msdn.microsoft.com/en-us/library/aa374219(v=VS.85).aspx)
3. 使用Reg-free，需要一些设置：
	- 需要将主程序exe对应的工程，设置非嵌入清单，这样它就在对应的目录下生成与主程序同名并且加上manifest后缀的配置文件。路径：工程右键属性—清单工具—输入与输出—嵌入清单，选择否。
	- 在manifest文件中，按照语法添加组件信息。

比如：某个动态库testDll.dll的IDL文件为

{% highlight c++ %}
import "oaidl.idl";
import "ocidl.idl";
 
[
    object,
    uuid(EEB0D834-0984-4D8D-94B5-3F0E2168C450),
    dual,
    nonextensible,
    helpstring("IInterfaceTest 接口"),
    pointer_default(unique)
]
interface IInterfaceTest : IDispatch{
    [id(1), helpstring("方法Print")] HRESULT Print([in] LONG val1, [in] LONG val2);
};
[
    uuid(B6F0BC76-3F04-424A-85F3-DA7C0CE89EF5),
    version(1.0),
    helpstring("testDll 1.0 类型库")
]
library testDllLib
{
    importlib("stdole2.tlb");
    [
       uuid(0C7116D0-8ABE-4AEC-A3CB-88CDA86CFFA1),
       helpstring("InterfaceTest Class")
    ]
    coclass InterfaceTest
    {
       [default] interface IInterfaceTest;
    };
};
{% endhighlight %}
 
主程序testexc.exe依赖于该组件，则test.exe.manifest为：

~~~~
	<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
	<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
	  <dependency>
	    <dependentAssembly>
	      <assemblyIdentity type="win32" name="Microsoft.VC80.CRT" version="8.0.50727.762" processorArchitecture="x86" publicKeyToken="1fc8b3b9a1e18e3b"></assemblyIdentity>
	    </dependentAssembly>
	  </dependency>
	  <dependency>
	    <dependentAssembly>
	      <assemblyIdentity type="win32" name="Microsoft.VC80.ATL" version="8.0.50727.762" processorArchitecture="x86" publicKeyToken="1fc8b3b9a1e18e3b"></assemblyIdentity>
	    </dependentAssembly>
	  </dependency>
	 
	  <file name="testDll.dll" hashalg="SHA1">
	    <comClass clsid="{0C7116D0-8ABE-4AEC-A3CB-88CDA86CFFA1}">
	    </comClass>
	    <typelib tlbid="{B6F0BC76-3F04-424A-85F3-DA7C0CE89EF5}" version="1.0" helpdir=""></typelib>
	  </file>
	 
	</assembly>
~~~~
 
说明：

- `<file>`元素可以表示一个COM动态库的信息，里面的`<typelib>`表示该库对应的类型库，可选的多个`<comClass>`表示动态库中的多个组件对应的clsid。
- 这样配置后就能在程序中，直接使用对应的组件，而不需要注册到注册表。 
 
 
## 自己接管类厂来创建对象

要创建组件，首先已经准备好了:

- 组件对应的动态库dll，
- 组件coclass的CLSID（__uuidof(InterfaceTest)），
- 还需要支持接口的GUID（__uuidof(IInterfaceTest)），
 
根据COM的机制，下面来模拟CoCreateInstance的行为：

1. 加载（LoadLibrary）动态库，找到导出函数"DllGetClassObject"
2. 使用组件CLSID和导出函数DllGetClassObject创建类厂，得到接口IClassFactory
3. 使用类厂的方法CreateInstance创建组件，得到对应的接口
 
注：  
CoCreateInstance依赖的动态库从注册表中找，而我们自己接管过程，则不需要涉及注册表。
 
例如：

{% highlight c++ %}
HINSTANCE hModule = ::LoadLibrary( pathDll );
if ( hModule )
{
    typedef HRESULT (__stdcall *FUNCTYPE_DllGetClassObject)(REFCLSID, REFIID, void**);
 
    FUNCTYPE_DllGetClassObject funGetClassObject = 
        (FUNCTYPE_DllGetClassObject)::GetProcAddress(hModule, "DllGetClassObject");
    if ( funGetClassObject )
    {
       // 获取类厂
       CComPtr<IClassFactory> spClassFactory;
       funGetClassObject( __uuidof(InterfaceTest), __uuidof(IClassFactory), (void**)&spClassFactory );
      
       if ( spClassFactory )
       {
           CComPtr<IInterfaceTest> spTest;
           spClassFactory->CreateInstance( NULL, __uuidof(IInterfaceTest), (void**)&spTest );
           if ( spTest )
           {
              spTest->Print(50, 50);
           }
           else
           {
            ::MessageBox( 0, L"Error to get Interface", L"DllTest", 0 );
           }
       }
 
    }
 
    ::FreeLibrary(hModule);
}
{% endhighlight %}

不过，需要注意的是自己接管的COM方式，只适合进程内，因为它会导致进程外组件的获取成为一个问题（就算通过序列化IStream传递过去了，也没有办法查询到对应的接口）。这也说明，默认的COM的API还能为我们处理进程间的组件传递的附加操作。
