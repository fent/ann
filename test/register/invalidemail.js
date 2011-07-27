(function() {
  var Ann, bot, nick, server;
  Ann = require('ann');
  server = 'irc.freenode.net';
  nick = 'notregistered342';
  bot = new Ann(server, nick, {
    password: 'triky34',
    email: 'bad@email',
    debug: true
  });
  bot.ready();
}).call(this);
