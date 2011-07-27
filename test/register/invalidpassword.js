(function() {
  var Ann, bot, nick, server;
  Ann = require('ann');
  server = 'irc.freenode.net';
  nick = 'notregisteredbefore23j2jsfd';
  bot = new Ann(server, nick, {
    password: 'no',
    email: 'hi@mail.com',
    debug: true
  });
  bot.ready();
}).call(this);
