(function() {
  var Ann, bot, nick, server;
  Ann = require('ann');
  server = 'irc.freenode.net';
  nick = 'loveshine';
  bot = new Ann(server, nick, {
    password: 'no',
    debug: true
  });
  bot.ready();
}).call(this);
