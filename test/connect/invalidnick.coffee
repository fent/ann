Ann = require 'ann'

server = 'irc.freenode.net'
nick = 'nick with spaces'

bot = new Ann server, nick,
  debug: true

bot.ready()
