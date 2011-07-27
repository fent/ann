(function() {
  var Ann, bot, nick, server;
  Ann = require('ann');
  server = 'irc.freenode.net';
  nick = 'nick';
  bot = new Ann(server, nick, {
    debug: true
  });
  bot.ready();
}).call(this);
