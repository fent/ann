Usage
------------------

    Ann = require('ann');

    // arguments passed are are server, nick [, options [, ircoptions]]
    bot = new Ann('irc.freenode.net', 'annbot', {
      password: 'hunter2',
      email: 'my@mail.com',
      channels: ['#primary-announce-channel', '#nowhere']
    });

    // start the bot
    bot.ready(function(err) {
      // this is called when the bot is ready
      // connected, identified, and has joined channel(s)

      bot.say('hi primary-announce-channel!');
      bot.say('#nowhere', 'hi no one');
    });

The cool thing about Ann that makes it so simple, is that if a password is provided in the options, it will automatically identify with nickserv. If the nick is **not** registered and an email is given as well, then it will register the nick.

It will then join all the channels and call the ready function. An error is passed to the callback function if there's a problen connecting, identifying, registering, or joining a channel.

The 3 options *password*, *email*, and *channels* are optional.

Ann is basically an extension of the [irc module](https://github.com/martynsmith/node-irc) aimed for convenience. You can pass any other options that you would in the irc module as the 4th parameter. Take a look at its [API](https://github.com/martynsmith/node-irc/blob/master/API.md) to know what the ircoptions object looks like.


Installation
------------
Using npm:

    $ npm install ann

