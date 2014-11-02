---
layout: article
title: Value and JsonParser in chrome
category: chrome
description: Class base::Value is a variant type to holder complex data, this article introduce the use of base::Value in chrome source code.
---
*Class base::Value is a variant type to holder complex data, this article introduce the use of `base::Value` in chrome source code.*


## base::Value
The Value class is the base class for Values. A Value can be instantiated via the Create\*Value() factory methods, or by directly creating instances of the subclasses.

{% highlight c++ %}

class BinaryValue;
class DictionaryValue;
class FundamentalValue;
class ListValue;
class StringValue;
class Value;


class BASE_EXPORT Value {
public:
  enum Type {
    TYPE_NULL = 0,
    TYPE_BOOLEAN,
    TYPE_INTEGER,
    TYPE_DOUBLE,
    TYPE_STRING,
    TYPE_BINARY,
    TYPE_DICTIONARY,
    TYPE_LIST
  };

  static Value* CreateNullValue();
  // other types use new FundamentalValue or new StringValue etc.

  Type GetType() const { return type_; }
  bool IsType(Type type) const { return type == type_; }

  virtual bool GetAsBoolean(bool* out_value) const;
  virtual bool GetAsInteger(int* out_value) const;
  virtual bool GetAsDouble(double* out_value) const;
  virtual bool GetAsString(std::string* out_value) const;
  virtual bool GetAsString(string16* out_value) const;
  virtual bool GetAsList(ListValue** out_value);
  virtual bool GetAsDictionary(DictionaryValue** out_value);

  // Subclasses return their own type directly in their overrides;
  virtual Value* DeepCopy() const;

  // Compares if two Value objects have equal contents.
  virtual bool Equals(const Value* other) const;
  static bool Equals(const Value* a, const Value* b);

  // ...

private:
  Type type_;
};
{% endhighlight %}


### FundamentalValue
FundamentalValue represents the simple fundamental types.
{% highlight c++ %}
class BASE_EXPORT FundamentalValue : public Value {
public:
  explicit FundamentalValue(bool in_value);
  explicit FundamentalValue(int in_value);
  explicit FundamentalValue(double in_value);

  // Overridden from Value:
  virtual bool GetAsBoolean(bool* out_value) const;
  virtual bool GetAsInteger(int* out_value) const;
  virtual bool GetAsDouble(double* out_value) const;
  virtual FundamentalValue* DeepCopy() const;
  virtual bool Equals(const Value* other) const;

private:
  union {
    bool boolean_value_;
    int integer_value_;
    double double_value_;
  };
};
{% endhighlight %}


### StringValue
{% highlight c++ %}
class BASE_EXPORT StringValue : public Value {
public:
  // Initializes a StringValue with a UTF-8 narrow character string.
  explicit StringValue(const std::string& in_value);

  // Initializes a StringValue with a string16.
  explicit StringValue(const string16& in_value);

  // Overridden from Value:
  virtual bool GetAsString(std::string* out_value) const;
  virtual bool GetAsString(string16* out_value) const;

  virtual StringValue* DeepCopy() const;
  virtual bool Equals(const Value* other) const;

private:
  std::string value_;
};
{% endhighlight %}


### BinaryValue
{% highlight c++ %}
class BASE_EXPORT BinaryValue: public Value {
public:
  // Creates a BinaryValue with a null buffer and size of 0.
  BinaryValue();

  // Creates a BinaryValue, taking ownership of the bytes
  // pointed to by |buffer|.
  BinaryValue(scoped_ptr<char[]> buffer, size_t size);

  virtual ~BinaryValue();

  // For situations where you want to keep ownership of your buffer,
  // this factory method creates a new BinaryValue by copying the
  // contents of the buffer that's passed in.
  static BinaryValue* CreateWithCopiedBuffer(const char* buffer,
        size_t size);

  size_t GetSize() const { return size_; }

  // May return NULL.
  char* GetBuffer() { return buffer_.get(); }
  const char* GetBuffer() const { return buffer_.get(); }

  // Overridden from Value:
  virtual BinaryValue* DeepCopy() const;
  virtual bool Equals(const Value* other) const;

private:
  scoped_ptr<char[]> buffer_;
  size_t size_;

  DISALLOW_COPY_AND_ASSIGN(BinaryValue);
};
{% endhighlight %}


### DictionaryValue
DictionaryValue provides a key-value dictionary with (optional) "path" parsing for recursive access; see the comment at the top of the file. Keys are |std::string|s and should be UTF-8 encoded.

{% highlight c++ %}
class BASE_EXPORT DictionaryValue : public Value {
public:
  DictionaryValue();
  virtual ~DictionaryValue();

  // Overridden from Value:
  virtual bool GetAsDictionary(DictionaryValue** out_value);
  virtual bool GetAsDictionary(
    const DictionaryValue** out_value) const;

  bool HasKey(const std::string& key) const;

  // Returns the number of Values in this dictionary.
  size_t size() const { return dictionary_.size(); }

  // Returns whether the dictionary is empty.
  bool empty() const { return dictionary_.empty(); }

  // Clears any current contents of this dictionary.
  void Clear();

  // A path has the form "<key>" or "<key>.<key>.[...]",
  // where "." indexes into the next DictionaryValue down.
  void Set(const std::string& path, Value* in_value);
  // ...

  // Normal usage:
  // Like Set(), but without special treatment of '.'
  void SetWithoutPathExpansion(const std::string& key,
        Value* in_value);

  void SetBooleanWithoutPathExpansion(const std::string& path,
        bool in_value);
  void SetIntegerWithoutPathExpansion(const std::string& path,
        int in_value);
  void SetDoubleWithoutPathExpansion(const std::string& path,
        double in_value);
  void SetStringWithoutPathExpansion(const std::string& path,
    const std::string& in_value);
  void SetStringWithoutPathExpansion(const std::string& path,
    const string16& in_value);


  // Like Get(), but without special treatment of '.'
  bool GetWithoutPathExpansion(const std::string& key,
    const Value** out_value) const;
  bool GetWithoutPathExpansion(const std::string& key,
        Value** out_value);
  bool GetBooleanWithoutPathExpansion(const std::string& key,
    bool* out_value) const;
  bool GetIntegerWithoutPathExpansion(const std::string& key,
    int* out_value) const;
  bool GetDoubleWithoutPathExpansion(const std::string& key,
    double* out_value) const;
  bool GetStringWithoutPathExpansion(const std::string& key,
    std::string* out_value) const;
  bool GetStringWithoutPathExpansion(const std::string& key,
    string16* out_value) const;
  bool GetDictionaryWithoutPathExpansion(
    const std::string& key,
    const DictionaryValue** out_value) const;
  bool GetDictionaryWithoutPathExpansion(const std::string& key,
    DictionaryValue** out_value);
  bool GetListWithoutPathExpansion(const std::string& key,
    const ListValue** out_value) const;
  bool GetListWithoutPathExpansion(const std::string& key,
    ListValue** out_value);

  // Like Remove(), but without special treatment of '.'
  virtual bool RemoveWithoutPathExpansion(const std::string& key,
    Value** out_value);

  DictionaryValue* DeepCopyWithoutEmptyChildren();
  void MergeDictionary(const DictionaryValue* dictionary);

  // Swaps contents with the |other| dictionary.
  virtual void Swap(DictionaryValue* other);

  // Overridden from Value:
  virtual DictionaryValue* DeepCopy() const;
  virtual bool Equals(const Value* other) const;

private:
  ValueMap dictionary_;

  DISALLOW_COPY_AND_ASSIGN(DictionaryValue);
};
{% endhighlight %}


### ListValue
This type of Value represents a list of other Value values.

{% highlight c++ %}
class BASE_EXPORT ListValue : public Value {
public:
  typedef ValueVector::iterator iterator;
  typedef ValueVector::const_iterator const_iterator;

  ListValue();

  // Clears the contents of this ListValue
  void Clear();

  // Returns the number of Values in this list.
  size_t GetSize() const { return list_.size(); }

  // Returns whether the list is empty.
  bool empty() const { return list_.empty(); }

  bool Set(size_t index, Value* in_value);
  bool Get(size_t index, const Value** out_value) const;
  bool Get(size_t index, Value** out_value);

  // Convenience forms of Get()
  bool GetBoolean(size_t index, bool* out_value) const;
  bool GetInteger(size_t index, int* out_value) const;
  bool GetDouble(size_t index, double* out_value) const;
  bool GetString(size_t index, std::string* out_value) const;
  bool GetString(size_t index, string16* out_value) const;
  bool GetBinary(size_t index, const BinaryValue** out_value) const;
  bool GetBinary(size_t index, BinaryValue** out_value);
  bool GetDictionary(size_t index, DictionaryValue** out_value);
  bool GetList(size_t index, ListValue** out_value);

  virtual bool Remove(size_t index, Value** out_value);
  bool Remove(const Value& value, size_t* index);
  iterator Erase(iterator iter, Value** out_value);
  bool Insert(size_t index, Value* in_value);
  const_iterator Find(const Value& value) const;

  // Appends a Value to the end of the list.
  void Append(Value* in_value);

  // Convenience forms of Append.
  void AppendBoolean(bool in_value);
  void AppendInteger(int in_value);
  void AppendDouble(double in_value);
  void AppendString(const std::string& in_value);
  void AppendString(const string16& in_value);
  void AppendStrings(const std::vector<std::string>& in_values);
  void AppendStrings(const std::vector<string16>& in_values);


  // Swaps contents with the |other| list.
  virtual void Swap(ListValue* other);

  // Iteration.
  iterator begin() { return list_.begin(); }
  iterator end() { return list_.end(); }

  const_iterator begin() const { return list_.begin(); }
  const_iterator end() const { return list_.end(); }

  // Overridden from Value:
  virtual bool GetAsList(ListValue** out_value);
  virtual bool GetAsList(const ListValue** out_value) const;
  virtual ListValue* DeepCopy() const;
  virtual bool Equals(const Value* other) const;

private:
  ValueVector list_;

  DISALLOW_COPY_AND_ASSIGN(ListValue);
};

{% endhighlight %}


## JsonParser
Json reader and writer can operate base::Value type.

{% highlight c++ %}

#include "base/values.h"
#include "base/json/json_writer.h"
#include "base/json/json_reader.h"


base::DictionaryValue dict;

dict.SetWithoutPathExpansion("resId",
        new base::FundamentalValue(100) );
dict.SetWithoutPathExpansion("fileName",
        new base::StringValue("hello.txt") );

base::ListValue * users = new base::ListValue();
users->AppendString( "suninf" );
users->AppendString( "zhenshan" );
dict.SetWithoutPathExpansion("users", users );

// writer
std::string json;
base::JSONWriter::Write(&dict, &json);

// reader
base::Value * val = base::JSONReader::Read(json);

assert( dict.Equals(val) );

{% endhighlight %}