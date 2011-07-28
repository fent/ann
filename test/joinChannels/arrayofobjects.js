(function() {
  var Ann, bot, nick, server;
  Ann = require('ann');
  server = 'irc.freenode.net';
  nick = 'annbot675';
  bot = new Ann(server, nick, {
    channels: [
      {
        prejoin: function(cb) {
          console.log('prejoin 1');
          return cb();
        },
        channels: ['#annbot', '#annbot2'],
        postjoin: function(cb) {
          console.log('postjoin 1');
          return cb();
        }
      }, {
        prejoin: function(cb) {
          console.log('prejoin 2');
          return cb();
        },
        channels: '#annbot3'
      }
    ],
    debug: true
  });
  bot.ready(function(err) {
    if (err) {
      throw err;
    }
    return console.log('last');
  });
}).call(this);
