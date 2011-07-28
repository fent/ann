Ann = require 'ann'

server = 'irc.freenode.net'
nick = 'annbot675'

bot = new Ann server, nick,
  channels: [
    {
      prejoin: (cb) ->
        console.log 'prejoin 1'
        cb()
      channels: ['#annbot', '#annbot2']
      postjoin: (cb) ->
        console.log 'postjoin 1'
        cb()
    }
    {
      prejoin: (cb) ->
        console.log 'prejoin 2'
        cb()
      channels: '#annbot3'
    }
  ]
  debug: true

bot.ready (err) ->
  throw err if err
  console.log 'last'
