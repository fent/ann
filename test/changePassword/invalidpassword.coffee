Ann = require 'ann'

server = 'irc.freenode.net'
nick = 'annbot732'

bot = new Ann server, nick,
  password: 'password'
  debug: true

bot.ready ->
  bot.changePassword 'no', (err) ->
    throw err if err
