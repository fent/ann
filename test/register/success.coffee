Ann = require 'ann'

server = 'irc.freenode.net'
nick = 'notregistered' + Math.floor(Math.random() * 1000)

bot = new Ann server, nick,
  password: 'hunter2'
  email: 'bad@email.com'
  debug: true

bot.ready()
