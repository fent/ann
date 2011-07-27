Ann = require 'Ann'

server = 'irc.freenode.net'
nick = 'Annbot4000'
channels = '#probetest'

bot = new Ann server, nick,
  password: 'hunter2'
  email: 'rlagydus@gmail.com'
  channels: channels

bot.ready (err) ->
  if err
    bot.disconnect()
    throw err
  console.log 'ready'.bold.green
