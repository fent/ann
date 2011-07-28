Ann = require 'ann'

server = 'irc.freenode.net'
nick = 'annbot675'

bot = new Ann server, nick,
  channels: 'lol'
  debug: true

bot.ready()
