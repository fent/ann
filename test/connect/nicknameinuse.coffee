Ann = require 'ann'

server = 'irc.freenode.net'
nick = 'john'

bot = new Ann server, nick,
  debug: true

bot.ready()
