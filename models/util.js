var request = require("request"),
  Deferred = require("Deferred");

exports.NOT_IMPLEMENTED = function(msg)
{
  throw new Error('Not implemented: ' + msg + '...');
};

exports.DBG_DEFERRED=function(dfd)
{
  return dfd.done(function(x){console.log('DONE', x);}).fail(function(x){console.log('FAIL',x);});
};

exports.compare = function(a, b)
{
  if( a == b )
    return 0;
  return a < b ? -1 : 1;
};

exports.requestAsync = function(url)
{
  console.log('making request: ' + url);
  return Deferred(function(dfd){
    return request(url, function(error, response, body){
      if(error)
        dfd.reject(error);
      else
        dfd.resolve(body, response);
    });
  });
};

exports.limitSize = function( size, maxSize )
{
  var aspect = size.width / size.height,
    newSize = {width: size.width, height: size.height };
  if(maxSize.width && newSize.width > maxSize.width)
  {
    newSize.width = maxSize.width;
    newSize.height = maxSize.width / aspect;
  }
  if(maxSize.height && newSize.height > maxSize.height)
  {
    newSize.height = maxSize.height;
    newSize.width = maxSize.height * aspect;
  }
  return newSize;
};