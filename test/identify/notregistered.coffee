Ann = require 'ann'

server = 'irc.freenode.net'
nick = 'anotherunregisterednick23423j23r'

bot = new Ann server, nick,
  debug: true

bot.ready ->
  bot.identify 'something', (err) ->
    throw err if err
