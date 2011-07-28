Ann = require 'ann'

server = 'irc.freenode.net'
nick = 'annbot675'

bot = new Ann server, nick,
  channels:
    prejoin: (cb) ->
      console.log 'prejoin'
      cb()
    channels: ['#annbot', '#annbot2']
    postjoin: (cb) ->
      console.log 'postjoin'
      cb()
  debug: true

bot.ready()
