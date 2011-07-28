# dependencies
irc      = require 'irc'
clc      = require 'cli-color'
test     = require './regex.js'
notices  = require './notices.js'
IRCError = require './IRCError.js'

# debug shortcuts
blue = (s) ->
  console.log clc.bold.blue s
green = (s) ->
  console.log clc.bold.green s
warn = (s) ->
  console.log clc.bold.red s


# makes new function for debuging that
# outputs to console when called
# pretty simple but I used this a lot
# and it's easier to make this than type more
debug = (f, color, str) ->
  (err) ->
    color str
    f err


class Ann extends irc.Client
  constructor: (@server, @nick, @options = {}, ircOptions = {}) ->
    ircOptions.autoConnect = false
    ircOptions.channels = []
    @setMaxListeners 0

    # emit notices by NickServ
    @on 'notice', (nick, to, text) ->
      if nick is 'NickServ'
        @emit 'nickserv', text
    super @server, @nick, ircOptions

    # emit messages by nick in channel
    @on 'message', (nick, to, text) ->
      @emit "message#{to}@#{nick}", text
      @emit "message@#{nick}", to, text

    # emits pms by nick
    @on 'pm', (nick, text) ->
      @emit "pm@#{nick}", text


  # callback function is called when it's connected, identified,
  # and has joined the channels
  ready: (cb = (->), options = @options) ->
    connect = =>
      @connect()

    afterConnect = =>
      @nickserv "verify register #{@nick} key", ((err) ->
        switch err.type

          # if it's not registered and password and email were provided,
          # attempt to register
          when 'notregistered'
            notregistered()

          # if it is registered and a password was provided,
          # try to identify
          when 'registered'
            registered err
        ), notices.registeredCheck

    notregistered = (err) ->
      if options.password and options.email
        register()
      else if options.password
        cb err
      else
        joinChannels()

    registered = (err) ->
     if options.password
       identify()
     else
       cb err

    # custom identify function for ready()
    # will call register if nick is not registered
    # calling the ready() function will either call identify/register
    # depending if the nick is already registered or not
    # never both
    identify = =>
      @identify options.password, (err) ->
        cb err if err
        afterIdentify()

    afterIdentify = ->
      joinChannels()
      
    # custom for ready()
    # will call joinChannels if successful
    register = =>
      @register options.password, options.email, (err) ->
        cb err if err
        afterRegister()
    
    afterRegister = ->
      joinChannels()

    joinChannels = =>
      @joinChannels options.channels, (err) ->
        cb err if err
        afterJoinChannels()
    
    afterJoinChannels = ->
      cb()

    # debugging purposes
    if options.debug
      @on 'raw', (message) ->
        for i in ['rpl_motd', 'rpl_motdstart', 'rpl_endofmotd', 'rpl_luserclient', 'rpl_luserop', 'rpl_luserunknown', 'rpl_luserchannels', 'rpl_luserme', '265', '266', '250', '002', '003', '004', '005', 'PING', 'NOTICE', 'err_nomotd', 'MODE', '001', 'rpl_namreply', 'rpl_endofnames', 'rpl_channelmodeis', '329']
          if message.command is i
            return
        console.log message

      # more debugging
      @on 'nickserv', (text) ->
        console.log "'#{clc.yellow(text)}'"

      connect           = debug connect, blue, 'connecting...'
      afterConnect      = debug afterConnect, green, 'connected'
      notregistered     = debug notregistered, warn, 'nick not registered'
      registered        = debug registered, green, 'nick registered'
      identify          = debug identify, blue, 'identifying...'
      afterIdentify     = debug afterIdentify, green, 'identified'
      register          = debug register, blue, 'registering...'
      afterRegister     = debug afterRegister, green, 'registered'
      joinChannels      = debug joinChannels, blue, 'joining channels...'
      afterJoinChannels = debug afterJoinChannels, green, 'channels joined'

      # custom cb function for debugging
      cb = ((cb) ->
        (err) ->
          throw err if err
          green 'ready'
          cb()
      )(cb)


    # wait for message from server while connecting
    wait = (message) ->
      if not @checkError notices.connect, message.command, ['raw', 'error'], wait, cb
        @checkSuccess notices.connect, message.command, ['raw', 'error'], wait, afterConnect

    # check nick
    if test.nick(@nick)
      return new IRCError cb, 'invalidnick', notices.connect, [@nick]

    @on 'raw', wait
    @on 'error', wait
    connect()


  checkError: (notices, text, events, wait, cb, args) ->
    for name, error of notices.error
      if error.match
        for m in error.match
          if (m.test? and m.test(text)) or m is text
            for event in events
              @removeListener event, wait
            new IRCError cb, name, notices, args
            return true
    false

  checkSuccess: (notices, text, events, wait, cb) ->
    for m in notices.success
      if (m.test? and m.test(text)) or m is text
        for event in events
          @removeListener event, wait
        return cb()
    false


  # waits for NickServ to send notice with the right message
  nickserv: (msg, cb, notices, args) ->
    wait = (text) ->
      if not @checkError notices, text, ['nickserv'], wait, cb, args
        @checkSuccess notices, text, ['nickserv'], wait, cb

    @on 'nickserv', wait
    @say 'NickServ', msg


  # identifies a nick calls cb on success or failure with err arg
  identify: (password, cb) ->
    # first check password is correct length, doesnt contain white space
    if test.password(password)
      return new IRCError cb, 'invalidpassword', notices.identify, [password]

    @nickserv "identify #{password}", cb, notices.identify, [@nick]


  # register current nick with NickServ
  # calls cb on success or failure with err arg
  register: (password, email, cb) ->
    # first check password and email
    if test.password(password)
      return new IRCError cb, 'invalidpassword', notices.register, [password]
    if test.email(email)
      return new IRCError cb, 'invalidemail', notices.register, [email]

    @nickserv "register #{password} #{email}", cb, notices.register, [email]


  # changes current nick's password
  changePassword: (password, cb) ->
    if test.password(password)
      return new IRCError cb, 'invalidpassword', notices.changePassword, [password]

    @nickserv "set password #{password}", cb, notices.changePassword, [password]


  # verify nick with a code sent through email
  verifyRegister: (nick, key, cb) ->
    if test.nick(nick)
      return new IRCError cb, 'invalidnick', notices.verifyRegister, [nick]
    if test.key(key)
      return new IRCError cb, 'invalidkey', notices.verifyRegister, [key]

    @nickserv "verify register #{nick} #{key}", cb, notices.verifyRegister, [nick]

  # modify the existing say function to work with one parameter
  say: (target, msg) ->
    if not msg? and @mainChannel
      super @mainChannel, target
    else
      super target, msg


Ann::joinChannels = require './join.js'
module.exports = Ann
