---
layout: article
title: FileStream in chrome
category: chrome
---

FileStream is a basic interface for reading and writing files synchronously or asynchronously with support for seeking to an offset. Generally speaking, we normally use asynchronous mode On a `TYPE_IO` Thread, because it's more effective. Note that even when used asynchronously, only one operation is supported at a time.

## FileStream class declare

{% highlight c++ %}
class NET_EXPORT FileStream {
 public:
  // Creates a |FileStream| with a new |BoundNetLog| (based on |net_log|)
  // attached.  |net_log| may be NULL if no logging is needed.
  // Uses |task_runner| for asynchronous operations.
  FileStream(net::NetLog* net_log,
             const scoped_refptr<base::TaskRunner>& task_runner);

  
  // |flags| is a bitfield of base::PlatformFileFlags when the file handle was
  // opened.
  FileStream(base::PlatformFile file,
             int flags,
             net::NetLog* net_log,
             const scoped_refptr<base::TaskRunner>& task_runner);

  // The underlying file is closed automatically.
  virtual ~FileStream();

  // Call this method to open the FileStream asynchronously.  The remaining
  // methods cannot be used unless the file is opened successfully. Returns
  // ERR_IO_PENDING if the operation is started. If the operation cannot be
  // started then an error code is returned.
  //
  // Once the operation is done, |callback| will be run on the thread where
  // Open() was called, with the result code. open_flags is a bitfield of
  // base::PlatformFileFlags.
  virtual int Open(const base::FilePath& path, int open_flags,
                   const CompletionCallback& callback);

  // Returns ERR_IO_PENDING and closes the file asynchronously, calling
  // |callback| when done.
  virtual int Close(const CompletionCallback& callback);

  // Closes the file immediately and returns OK. If the file is open
  // asynchronously, Close(const CompletionCallback&) should be used instead.
  virtual int CloseSync();

  // Returns true if Open succeeded and Close has not been called.
  virtual bool IsOpen() const;

  // Adjust the position from where data is read asynchronously.
  // Upon success, ERR_IO_PENDING is returned and |callback| will be run
  // on the thread where Seek() was called with the the stream position
  // relative to the start of the file.  Otherwise, an error code is returned.
  // It is invalid to request any asynchronous operations while there is an
  // in-flight asynchronous operation.
  virtual int Seek(Whence whence, int64 offset,
                   const Int64CompletionCallback& callback);

  // Adjust the position from where data is read synchronously.
  // Upon success, the stream position relative to the start of the file is
  // returned.  Otherwise, an error code is returned.  It is not valid to
  // call SeekSync while a Read call has a pending completion.
  virtual int64 SeekSync(Whence whence, int64 offset);

  // Returns the number of bytes available to read from the current stream
  // position until the end of the file.  Otherwise, an error code is returned.
  virtual int64 Available();

  // Call this method to read data from the current stream position
  // asynchronously. Up to buf_len bytes will be copied into buf.  (In
  // other words, partial reads are allowed.)  Returns the number of bytes
  // copied, 0 if at end-of-file, or an error code if the operation could
  // not be performed.
  //
  // The file must be opened with PLATFORM_FILE_ASYNC, and a non-null
  // callback must be passed to this method. If the read could not
  // complete synchronously, then ERR_IO_PENDING is returned, and the
  // callback will be run on the thread where Read() was called, when the
  // read has completed.
  //
  // It is valid to destroy or close the file stream while there is an
  // asynchronous read in progress.  That will cancel the read and allow
  // the buffer to be freed.
  //
  // This method must not be called if the stream was opened WRITE_ONLY.
  virtual int Read(IOBuffer* buf, int buf_len,
                   const CompletionCallback& callback);

  // Call this method to write data at the current stream position
  // asynchronously.  Up to buf_len bytes will be written from buf. (In
  // other words, partial writes are allowed.)  Returns the number of
  // bytes written, or an error code if the operation could not be
  // performed.
  //
  // The file must be opened with PLATFORM_FILE_ASYNC, and a non-null
  // callback must be passed to this method. If the write could not
  // complete synchronously, then ERR_IO_PENDING is returned, and the
  // callback will be run on the thread where Write() was called when
  // the write has completed.
  virtual int Write(IOBuffer* buf, int buf_len,
                    const CompletionCallback& callback);

  // Call this method to open the FileStream synchronously.
  // If the file stream is not closed manually, the underlying file will be
  // automatically closed when FileStream is destructed.
  virtual int OpenSync(const base::FilePath& path, int open_flags);

  // Call this method to read data from the current stream position
  // synchronously. Up to buf_len bytes will be copied into buf. 
  // Returns the number of bytes copied, 0 if at end-of-file, 
  // or an error code if the operation could not be performed.
  virtual int ReadSync(char* buf, int buf_len);

  // Performs the same as ReadSync, but ensures that exactly buf_len bytes
  // are copied into buf.  A partial read may occur, but only as a result of
  // end-of-file or fatal error.  Returns the number of bytes copied into buf,
  // 0 if at end-of-file and no bytes have been read into buf yet,
  // or an error code if the operation could not be performed.
  virtual int ReadUntilComplete(char *buf, int buf_len);

  // Call this method to write data at the current stream position
  // synchronously.  Up to buf_len bytes will be written from buf. (In
  // other words, partial writes are allowed.)  Returns the number of
  // bytes written, or an error code if the operation could not be
  // performed.
  //
  // The file must not be opened with PLATFORM_FILE_ASYNC.
  // This method must not be called if the stream was opened READ_ONLY.
  //
  // Zero byte writes are not allowed.
  virtual int WriteSync(const char* buf, int buf_len);

  // Truncates the file to be |bytes| length. This is only valid for writable
  // files. After truncation the file stream is positioned at |bytes|. The new
  // position is returned, or a value < 0 on error.
  // WARNING: one may not truncate a file beyond its current length on any
  //   platform with this call.
  virtual int64 Truncate(int64 bytes);

  // Forces out a filesystem sync on this file to make sure that the file was
  // written out to disk and is not currently sitting in the buffer. This does
  // not have to be called, it just forces one to happen at the time of
  // calling.
  //
  // The file must be opened with PLATFORM_FILE_ASYNC, and a non-null
  // callback must be passed to this method. If the write could not
  // complete synchronously, then ERR_IO_PENDING is returned, and the
  // callback will be run on the thread where Flush() was called when
  // the write has completed.
  //
  // It is valid to destroy or close the file stream while there is an
  // asynchronous flush in progress.  That will cancel the flush and allow
  // the buffer to be freed.
  //
  // It is invalid to request any asynchronous operations while there is an
  // in-flight asynchronous operation.
  //
  // This method should not be called if the stream was opened READ_ONLY.
  virtual int Flush(const CompletionCallback& callback);

  // Forces out a filesystem sync on this file to make sure that the file was
  // written out to disk and is not currently sitting in the buffer. This does
  // not have to be called, it just forces one to happen at the time of
  // calling.
  //
  // Returns an error code if the operation could not be performed.
  //
  // This method should not be called if the stream was opened READ_ONLY.
  virtual int FlushSync();

  // Turns on UMA error statistics gathering.
  void EnableErrorStatistics();

  // Sets the source reference for net-internals logging.
  // Creates source dependency events between |owner_bound_net_log| and
  // |bound_net_log_|.  Each gets an event showing the dependency on the other.
  // If only one of those is valid, it gets an event showing that a change
  // of ownership happened, but without details.
  void SetBoundNetLogSource(const net::BoundNetLog& owner_bound_net_log);

  // Returns the underlying platform file for testing.
  base::PlatformFile GetPlatformFileForTesting();

 private:
  class Context;

  bool is_async() const { return !!(open_flags_ & base::PLATFORM_FILE_ASYNC); }

  int open_flags_;
  net::BoundNetLog bound_net_log_;

  // Context performing I/O operations. It was extracted into separate class
  // to perform asynchronous operations because FileStream can be destroyed
  // before completion of async operation. Also if async FileStream is destroyed
  // without explicit closing file should be closed asynchronously without
  // delaying FileStream's destructor. To perform all that separate object is
  // necessary.
  scoped_ptr<Context> context_;

  DISALLOW_COPY_AND_ASSIGN(FileStream);
};
{% endhighlight %}

## Sample

The example below shows how to use FileStream's APIs asynchronously, helper function `ReadFileAsync` should be used on thread with type IO.

{% highlight c++ %}
#include "base/bind.h"
#include "base/file_util.h"
#include "base/memory/scoped_ptr.h"
#include "base/memory/ref_counted.h"
#include "base/task_runner.h"
#include "base/files/file_path.h"

#include "net/base/file_stream.h"
#include "net/base/net_errors.h"
#include "net/base/io_buffer.h"
#include "net/base/load_flags.h"

#include <assert.h>
#include <string>

namespace internal {

// File basic info
struct FileBasicInfo 
{
  FileBasicInfo() : file_size(0), file_exists(false) {}

  int file_size;
  bool file_exists;
};

// file reader
class FileReader
{
public:
  FileReader( const scoped_refptr<base::TaskRunner>& file_task_runner )
    : file_task_runner_(file_task_runner)
    , stream_(new net::FileStream(NULL, file_task_runner))
    , file_size_(0)
    , ready_for_read_(true)
  {
  }

  bool Read( std::wstring const& filePath, base::Callback<void(int,std::string)> completeCallback ) 
  {
    if ( !base::MessageLoop::current() || 
      base::MessageLoop::current()->type() != base::MessageLoop::TYPE_IO ) 
    {
      assert(false && "MUST called on base::Thread IO message_loop");
      return false;
    }

    if ( !ready_for_read_ ) 
    {
      // A reading task is in progress
      return false;
    }

    file_path_ = base::FilePath(filePath);
    complete_callback_ = completeCallback;

    FileBasicInfo* meta_info = new FileBasicInfo();

    file_task_runner_->PostTaskAndReply( FROM_HERE, 
      base::Bind(&FileReader::FetchMetaInfo, file_path_, base::Unretained(meta_info)),
      base::Bind(&FileReader::DidFetchMetaInfo, base::Unretained(this), base::Owned(meta_info)) );

    ready_for_read_ = false;
    return true;
  }

private:
  static void FetchMetaInfo(const base::FilePath& file_path, FileBasicInfo* meta_info) 
  {
    base::PlatformFileInfo platform_info;
    meta_info->file_exists = file_util::GetFileInfo(file_path, &platform_info);
    if (meta_info->file_exists) 
    {
      meta_info->file_size = (int)platform_info.size;
    }   
  }

  void DidFetchMetaInfo(const FileBasicInfo* meta_info)
  {
    if (!meta_info->file_exists) 
    {
      // file not exist
      DidReadFileFailed(net::ERR_FILE_NOT_FOUND);
      return;
    }

    if ( meta_info->file_size == 0 ) 
    {
      // empty file
      DidReadFileFailed(net::ERR_FAILED);
      return;
    }
    file_size_ = meta_info->file_size;
    
    if ( !stream_ ) 
    {
      stream_.reset( new net::FileStream(NULL, file_task_runner_) );
    }
    
    int flags = base::PLATFORM_FILE_OPEN | base::PLATFORM_FILE_READ | base::PLATFORM_FILE_ASYNC;
    int rv = stream_->Open(base::FilePath(file_path_), flags,
      base::Bind(&FileReader::DidOpen, base::Unretained(this)));

    if (rv != net::ERR_IO_PENDING)
      DidOpen(rv);
  }

  void DidOpen(int result) 
  {
    if (result != net::OK) {
      // open failed
      DidReadFileFailed(net::ERR_ACCESS_DENIED);
      return;
    }

    read_buffer_ = new net::IOBuffer(file_size_);

    if (file_size_ > 0 ) 
    {// seek to position 0
      int rv = stream_->Seek(net::FROM_BEGIN, 0, 
        base::Bind(&FileReader::DidSeek, base::Unretained(this)));

      if (rv != net::ERR_IO_PENDING) {
        // seek failed
        DidSeek(-1);
      }
    }
  }

  void DidSeek(int64 result)
  {
    if (result != 0) 
    {
      // seek failed
      DidReadFileFailed(net::ERR_FAILED);
      return;
    }

    int rv = stream_->Read(read_buffer_.get(), file_size_,
      base::Bind(&FileReader::DidReadFileData, base::Unretained(this)));

    if ( rv >= 0 ) {
      // Data is immediately available.
      DidReadFileData(rv);
      return;
    }
  }

  void DidReadFileData(int result)
  {
    std::string data = std::string(read_buffer_->data(), file_size_);
    complete_callback_.Run( net::OK, data );

    ResetReader();
  }

  void DidReadFileFailed(int result)
  {
    complete_callback_.Run(result, "");
    
    ResetReader();
  }

  void ResetReader()
  {
    stream_.reset();
    file_size_ = 0;
    file_path_.clear();
    read_buffer_ = NULL;
    ready_for_read_ = true;
  }

private:
  const scoped_refptr<base::TaskRunner> file_task_runner_;
  scoped_ptr<net::FileStream> stream_;
  scoped_refptr<net::IOBuffer> read_buffer_;
  base::FilePath file_path_;
  int file_size_;
  bool ready_for_read_;
  base::Callback<void(int,std::string)> complete_callback_;
};

// ReadFileAsyncHelper
class ReadFileAsyncHelper 
  : public base::RefCountedThreadSafe<ReadFileAsyncHelper>
{
public:
  ReadFileAsyncHelper(const scoped_refptr<base::TaskRunner>& file_task_runner, std::wstring const& filePath, base::Callback<void(int,std::string)> completeCallback) 
    : file_reader_( new FileReader(file_task_runner) ) 
    , complete_callback_(completeCallback)
    , file_path_(filePath)
  {
  }

  bool Start()
  {// Reference of this is token by callback to FileReader, which is only released in callback
    return file_reader_->Read(file_path_, base::Bind(&ReadFileAsyncHelper::OnReadComplete, this));
  }

private:
  void OnReadComplete( int status, std::string data )
  {
    complete_callback_.Run(status, data);
    delete file_reader_;
    file_reader_ = NULL;
  }

private:
  FileReader * file_reader_;
  std::wstring file_path_;
  base::Callback<void(int,std::string)> complete_callback_;
};

}//namespace internal

// Read file async
// When the file is read, callback will be called on the call thread
inline bool ReadFileAsync( 
  const scoped_refptr<base::TaskRunner>& file_task_runner, 
  std::wstring const& filePath, 
  base::Callback<void(int,std::string)> completeCallback )
{
  scoped_refptr<internal::ReadFileAsyncHelper> readHelper 
    = new internal::ReadFileAsyncHelper( file_task_runner, filePath, completeCallback );
  return readHelper->Start();
}

{% endhighlight %}



