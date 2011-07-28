(function() {
  var Ann, bot, nick, server;
  Ann = require('ann');
  server = 'irc.freenode.net';
  nick = 'annbot675';
  bot = new Ann(server, nick, {
    channels: {
      prejoin: function(cb) {
        console.log('prejoin');
        return cb();
      },
      channels: ['#annbot', '#annbot2'],
      postjoin: function(cb) {
        console.log('postjoin');
        return cb();
      }
    },
    debug: true
  });
  bot.ready();
}).call(this);
