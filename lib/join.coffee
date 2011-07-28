# dependencies
async    = require 'async'
test     = require './regex.js'
notices  = require './notices.js'
IRCError = require './IRCError.js'


# typical cb function needed in many of these async calls
c = (cb) -> cb()

# check objects
isArray = (o) ->
  Object::toString.call(o) is '[object Array]'

isString = (o) ->
  typeof o is 'string'

isFunction = (o) ->
  typeof o is 'function'


iterateArray = (object, series, f, cb) ->
  newF = (=> f.apply @, arguments)
  if series
    async.forEachSeries.call @, object, newF, cb
  else
    async.forEach.call @, object, newF, cb

# shortcut
sc = (list, object, attr, f) ->
  if object[attr]
    list[attr] = f.call @, object[attr]

# makes functions for pre/post joining channels
# returns a function with a callback
# that should be called when it finishes
# to let the async.series function know the next
# function can execute
joinFun = (object = c, series) ->
  if isFunction object
    object
  else if isArray object
    newF = (o) => joinFun.call @, o
    (cb) =>
      iterateArray.call @, object, series, newF, cb

  else if object instanceof Object
    list = {}
    sc.call @, list, object, 'request', requestFun
    sc.call @, list, object, 'say'    , sayFun
    (cb) ->
      async.parallel list, => cb.call @, arguments
  else
    c


# shortcut for shortcuts
scFun = (fun) ->
  (object = c, series, fun) ->
    if isArray object
      newF = (o) => fun.call @, o
      (cb) =>
        iterateArray.call @, object, series, newF, cb
    else if object instanceof Object
      fun.call @, object
    else
      c

# shortcut for requests
requestFun = scFun requestFun, (object) ->
  optionalcb = object.cb ? (cb, err) -> cb err
  (cb) =>
    request object, (err, res, body) =>
      optionalcb.apply @, [cb].concat arguments

# shortcut for pm
sayFun = scFun sayFun, (object) ->
  (cb) =>
    if test.nick(object.target) and test.channel(object.target)
      return new IRCError cb, 'invalidtarget', notices.join, [object.target]

    optionalcb = object.cb ? c

    # if enabled, wait for reply from user/channel msg'd
    event = "pm@#{object.target}"
    if object.waitForReply
      waitForReply = (text) =>
        @removeListener event, waitForReply
        optionalcb.apply @, [cb].concat arguments
      @on event, waitForReply

    # if enabled, wait for invite from user pm'd
    if object.waitForInvite
      waitForInvite = (channel, from) =>
        if from is object.target
          @removeListener 'invite', waitForInvite
          if object.waitForReply
            @removeListener event, waitForReply
          optionalcb.apply @, [cb].concat arguments
      @on 'invite', waitForInvite

    # send message
    @say object.target, object.msg


# joins a list of channels
# most recursion function ever
module.exports = (channels, cb = (->), series) ->
  # check if channels object is null
  if not channels
    cb()

  # join a single channel
  else if isString channels
    # split in case password is provided
    [channel, password] = channels.split(' ')

    # first check channel name is right
    if test.channel(channel)
      return new IRCError cb, 'invalidchannel', notices.join, [channel]

    # check password
    if test.channelpassword(password)
      return new IRCError cb, 'invalidpassword', notices.join, [password]

    # TODO: I don't know how to set the password
    @join channel, -> cb()

  # join a list of channels
  # can be joined in parallel or in series
  else if isArray channels
    iterateArray.call @, channels, series, @joinChannels, cb

  # more detailed channels object has more options
  else if channels instanceof Object
    join = (cb) =>
      @joinChannels(channels.channels, ((err) -> cb err), channels.series or series)

    # execute prejoin, join and postjoin functions in series
    async.series([
      joinFun.call @, channels.prejoin
      join
      joinFun.call @, channels.postjoin
    ], (err, results) -> cb err)
