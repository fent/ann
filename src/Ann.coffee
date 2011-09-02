# dependencies
irc      = require 'irc'
clc      = require 'cli-color'
test     = require './regex.js'
notices  = require './notices.js'
IRCError = require './IRCError.js'

# debug shortcuts
blue = (s) ->
  ->
    console.log clc.bold.blue s
green = (s) ->
  ->
    console.log clc.bold.green s
warn = (s) ->
  ->
    console.log clc.bold.red s


class Ann extends irc.Client
  constructor: (@server, @nick, @options = {}, ircOptions = {}) ->
    ircOptions.autoConnect = false
    ircOptions.channels = []
    @setMaxListeners 0

    # emit notices by NickServ
    @on 'notice', (nick, to, text) ->
      if nick is 'NickServ'
        @emit 'nickserv', text

    # emit messages by nick in channel
    @on 'message', (nick, to, text) ->
      @emit "message#{to}@#{nick}", text
      @emit "message@#{nick}", to, text

    # emits pms by nick
    @on 'pm', (nick, text) ->
      @emit "pm@#{nick}", text

    super @server, @nick, ircOptions


  # overwrite connect function and adds optional callback
  connect: (cb = (->)) ->
    @emit 'connecting'

    # wait for message from server while connecting
    wait = (message) ->
      if not @checkError notices.connect, message.command, ['raw', 'error'], wait, cb
        @checkSuccess notices.connect, message.command, ['raw', 'error'], wait, ->
          @emit 'connected'
          cb()

    # check nick
    if test.nick(@nick)
      return new IRCError cb, 'invalidnick', notices.connect, [@nick]

    @on 'raw', wait
    @on 'error', wait
    super()


  # callback function is called when it's connected, identified,
  # and has joined the channels
  ready: (cb = ((err) -> throw err if err), options = @options) ->
    @emit 'connecting'
    afterConnect = =>
      @isRegistered @nick, (registered, err) ->
        # if it is registered and a password was provided,
        # try to identify
        if registered
          if options.password
            identify()
          else
            cb err

        # if it's not registered and password and email were provided,
        # attempt to register
        else
          if options.password and options.email
            register()

          # return error if only one of them was given
          else if options.password or options.email
            cb err
          else
            joinChannels()


    # custom identify function for connect()
    # will call register if nick is not registered
    # calling the ready() function will either call identify/register
    # depending if the nick is already registered or not
    # never both
    identify = =>
      @identify options.password, (err) ->
        return cb err if err
        joinChannels()

    # custom for ready()
    # will call joinChannels if successful
    register = =>
      @register options.password, options.email, (err) ->
        return cb err if err
        joinChannels()

    joinChannels = =>
      @joinChannels options.channels, cb

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

      @on 'connect',     blue 'connecting...'
      @on 'connected',  green 'connected'
      @on 'identifying', blue 'identifying...'
      @on 'identified', green 'identified'
      @on 'registering', blue 'registering...'
      @on 'registered', green 'registered'
      @on 'joining',     blue 'joining...'
      @on 'joined',     green 'joined'

    @connect (err) ->
      return cb err if err
      afterConnect()



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


  # check if nick is registered with nickserv
  isRegistered: (nick, cb) ->
    if test.nick(nick)
      return new IRCError cb, 'invalidnick', notices.verifyRegister, [nick]

    @emit 'checkingregistered'
    @nickserv "verify register #{nick} key", ((err) =>
      switch err.type
        when 'notregistered'
          @emit 'notregistered'
          cb false, err

        when 'registered'
          @emit 'registered'
          cb true, err

      ), notices.isRegistered, [nick]


  # identifies a nick calls cb on success or failure with err arg
  identify: (password, cb) ->
    # first check password is correct length, doesnt contain white space
    if test.password(password)
      return new IRCError cb, 'invalidpassword', notices.identify, [password]

    @emit 'identifying'
    newcb = (err) =>
      return cb err if err
      @emit 'identified'
      cb()

    @nickserv "identify #{password}", newcb, notices.identify, [@nick]


  # register current nick with NickServ
  # calls cb on success or failure with err arg
  register: (password, email, cb) ->
    # first check password and email
    if test.password(password)
      return new IRCError cb, 'invalidpassword', notices.register, [password]
    if test.email(email)
      return new IRCError cb, 'invalidemail', notices.register, [email]

    @emit 'registering'
    newcb = (err) =>
      return cb err if err
      @emit 'registered'
      cb()

    @nickserv "register #{password} #{email}", newcb, notices.register, [email]


  # changes current nick's password
  changePassword: (password, cb) ->
    if test.password(password)
      return new IRCError cb, 'invalidpassword', notices.changePassword, [password]

    @emit 'changingpassword'
    newcb = (err) =>
      return cb err if err
      @emit 'passwordchanged'
      cb()

    @nickserv "set password #{password}", newcb, notices.changePassword, [password]


  # verify nick with a code sent through email
  verifyRegister: (nick, key, cb) ->
    if test.nick(nick)
      return new IRCError cb, 'invalidnick', notices.verifyRegister, [nick]
    if test.key(key)
      return new IRCError cb, 'invalidkey', notices.verifyRegister, [key]

    @emit 'verifying'
    newcb = (err) =>
      return cb err if err
      @emit 'verified'
      cb()

    @nickserv "verify register #{nick} #{key}", newcb, notices.verifyRegister, [nick]


Ann::joinChannels = require './join'
module.exports = Ann
