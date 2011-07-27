(function() {
  var Ann, bot, nick, server;
  Ann = require('ann');
  server = 'irc.freenode.net';
  nick = 'anotherunregisterednick23423j23r';
  bot = new Ann(server, nick, {
    debug: true
  });
  bot.ready(function() {
    return bot.identify('something', function(err) {
      if (err) {
        throw err;
      }
    });
  });
}).call(this);
