request = require('request')
Deferred = require('Deferred')

module.exports =

  NOT_IMPLEMENTED: (msg) ->
    throw new Error("Not implemented: #{msg||''}...")

  DBG_DEFERRED : (dfd) ->
    dfd.done((x) -> console.log('DONE', x)).fail((x)->console.log('FAIL',x))

  compare : (a, b) ->
    if( a == b )
      return 0
    return if a < b then -1 else 1

  requestAsync: (url) ->
    console.log("making request: #{url}")
    Deferred((dfd)->
      request(url, (error, response, body)->
        if(error)
          dfd.reject(error)
        else
          dfd.resolve(body, response)
      )
    )

  limitSize: ( size, maxSize ) ->
    aspect = size.width / size.height
    {width, height} = size
    if(maxSize.width && width > maxSize.width)
      width = maxSize.width
      height = maxSize.width / aspect
    if(maxSize.height && height > maxSize.height)
      height = maxSize.height
      width = maxSize.height * aspect
    return {width, height}

  throwError: (err) -> throw err

  when: Deferred.when

  whenAll: () ->
    Deferred.when.apply(null, arguments)

  reject: (args...) ->
    Deferred( (dfd)-> dfd.rejectWith(dfd, args) )


