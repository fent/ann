(function() {
  var Ann, bot, nick, server;
  Ann = require('ann');
  server = 'irc.freenode.net';
  nick = 'annbot675';
  bot = new Ann(server, nick, {
    channels: ['#annbot', '#annbot2'],
    debug: true
  });
  bot.ready();
}).call(this);
