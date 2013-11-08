request = require('request')
Deferred = require('Deferred')

exports.NOT_IMPLEMENTED = (msg) ->
  throw new Error("Not implemented: #{msg||''}...")

exports.DBG_DEFERRED = (dfd) ->
  dfd.done((x) -> console.log('DONE', x)).fail((x)->console.log('FAIL',x))

exports.compare = (a, b) ->
  if( a == b )
    return 0
  return if a < b then -1 else 1


exports.requestAsync = (url) ->
  console.log("making request: #{url}")
  Deferred((dfd)->
    request(url, (error, response, body)->
      if(error)
        dfd.reject(error)
      else
        dfd.resolve(body, response)
    )
  )

exports.limitSize = ( size, maxSize ) ->
  aspect = size.width / size.height
  {width, height} = size
  if(maxSize.width && width > maxSize.width)
    width = maxSize.width
    height = maxSize.width / aspect
  if(maxSize.height && height > maxSize.height)
    height = maxSize.height
    width = maxSize.height * aspect
  return {width, height}
