(function() {
  var Ann, bot, channels, nick, server;
  Ann = require('Ann');
  server = 'irc.freenode.net';
  nick = 'Annbot4000';
  channels = '#probetest';
  bot = new Ann(server, nick, {
    password: 'hunter2',
    email: 'rlagydus@gmail.com',
    channels: channels
  });
  bot.ready(function(err) {
    if (err) {
      bot.disconnect();
      throw err;
    }
    return console.log('ready'.bold.green);
  });
}).call(this);
