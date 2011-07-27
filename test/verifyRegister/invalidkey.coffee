Ann = require 'ann'

server = 'irc.freenode.net'
nick = 'annbot9000'

bot = new Ann server, nick,
  debug: true

bot.ready ->
  bot.verifyRegister 'whatever', '', (err) ->
    throw err if err
