(function() {
  var Ann, bot, nick, server;
  Ann = require('ann');
  server = 'irc.freenode.net';
  nick = 'annbot' + Math.floor(Math.random() * 1000);
  bot = new Ann(server, nick, {
    password: 'password',
    debug: true
  });
  bot.ready(function() {
    return bot.verifyRegister(nick, 'tubes', function(err) {
      if (err) {
        throw err;
      }
    });
  });
}).call(this);
