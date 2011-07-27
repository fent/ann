(function() {
  var Ann, bot, nick, server;
  Ann = require('ann');
  server = 'irc.freenode.net';
  nick = 'notregistered659';
  bot = new Ann(server, nick, {
    password: 'looooooooooooooooooooooooooooooooooooooooooooooooooooooooooong',
    email: 'hi@mail.com',
    debug: true
  });
  bot.ready();
}).call(this);
