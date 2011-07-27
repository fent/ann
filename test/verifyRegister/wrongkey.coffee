Ann = require 'ann'

server = 'irc.freenode.net'
nick = 'annbot' + Math.floor(Math.random() * 1000)

bot = new Ann server, nick,
  password: 'password'
  email: 'doesnt@mat.ter'
  debug: true

bot.ready ->
  bot.verifyRegister nick, 'thiskeyiswrong', (err) ->
    throw err if err
