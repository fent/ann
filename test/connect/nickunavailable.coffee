Ann = require 'ann'

server = 'irc.freenode.net'
nick = 'nick' # sometimes works. any suggestions?

bot = new Ann server, nick,
  debug: true

bot.ready()
