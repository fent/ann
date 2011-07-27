(function() {
  var Ann, bot, nick, server;
  Ann = require('ann');
  server = 'irc.freenode.net';
  nick = 'annbot9000';
  bot = new Ann(server, nick, {
    debug: true
  });
  bot.ready(function() {
    return bot.verifyRegister('whatever', '', function(err) {
      if (err) {
        throw err;
      }
    });
  });
}).call(this);
