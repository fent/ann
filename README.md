Usage
------------------

    Ann = require('ann');

    // arguments passed are are server, nick [, options [, ircoptions]]
    bot = new Ann('irc.freenode.net', 'annbot', {
      password: 'hunter2',
      email: 'my@mail.com',
      channels: ['#channel', '#nowhere']
    });

    // start the bot
    bot.ready(function(err) {
      // this is called when the bot is ready
      // connected, identified, and has joined channel(s)

      bot.say('#nowhere', 'hi no one');
    });

The cool thing about Ann that makes it so simple, is that if a password is provided in the options, it will automatically identify with nickserv. If the nick is **not** registered and an email is given as well, then it will register the nick.

It will then join all the channels and call the ready function. An error is passed to the callback function if there's a problen connecting, identifying, registering, or joining a channel.

Ann is basically an extension of the [irc module](https://github.com/martynsmith/node-irc) aimed for convenience. You can pass any other options that you would in the irc module as the 4th parameter. Take a look at its [API](https://github.com/martynsmith/node-irc/blob/master/API.md) to know what the ircoptions object looks like.


The Channels Option
-------------------
The channels option can be as simple as you want or as deep as you need it. If it's a string, it will join the channel in that string. It can also be an array of channels options, which means it can be an array of strings each containing a channel name.

One last thing the channels option can be is an object containing functions that will be executed before and after joining the channel(s). The default channels object looks like this:

    {
      prejoin: function(cb) { cb() }, // can be a function that calls
                                      // a callback when finished,
                                      // a list of functions, or
                                      // an object with a
                                      // pre/postjoin structure
      channels: [],
      series: false
      postjoin: function(cb) { cb() } // same as prejoin but will
                                      // execute after joining channel(s)
    }

# The Pre/Post Join Object

Just like the channels object, the pre/post join object can be either a function, an array of functions that get executed in parallel or series, or an object with a structure like the following:

    {
      request: {
        url: 'http://google.com',
        cb: function(cb, err, res, body) {
          if(!err) {
            console.log(body);
          }
          cb(err);
        }
      },

      say: [{
        target: 'bot9000',
        msg: 'hi invite me please',
        waitForInvite: true
      },
      {
        target: '#channel',
        msg: 'hello everyone',
        waitForReply: true
      }],

      series: false
                                       
    }

Requests are common to execute before joining a channel, so they are included as a shortcut. So is sending a message to a user for an invite. Both the request and say attributes can optionally be arrays of objects with the same structures as above. If they are, they will be executed in parallel or series depending on the *series* option, which defaults to false.


Install
------------

    npm install ann

