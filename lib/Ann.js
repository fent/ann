(function() {
  var Ann, CHANNEL, EMAIL, KEY, NICK, PASSWORD, blue, clc, debug, green, irc, makeError, notices, vsprintf, warn;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  irc = require('irc');
  vsprintf = require('sprintf').vsprintf;
  clc = require('cli-color');
  notices = require('./notices.js');
  blue = function(s) {
    return console.log(clc.bold.blue(s));
  };
  green = function(s) {
    return console.log(clc.bold.green(s));
  };
  warn = function(s) {
    return console.log(clc.bold.red(s));
  };
  NICK = /^[A-Z_\-\[\]\\^{}|`][A-Z0-9_\-\[\]\\^{}|`]*$/i;
  PASSWORD = /^[^\s]{5,}$/;
  EMAIL = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
  CHANNEL = /^[#&][^\x07\x2C\s]{,200}$/;
  KEY = /^[A-Z0-9]+$/i;
  debug = function(f, color, str) {
    return function(err) {
      color(str);
      return f(err);
    };
  };
  makeError = function(cb, name, text, args) {
    var err;
    if (args == null) {
      args = [];
    }
    err = new Error(vsprintf(text, args));
    err.name = name;
    return cb(err);
  };
  Ann = (function() {
    __extends(Ann, irc.Client);
    function Ann(server, nick, options, ircOptions) {
      this.server = server;
      this.nick = nick;
      this.options = options != null ? options : {};
      if (ircOptions == null) {
        ircOptions = {};
      }
      ircOptions.autoConnect = false;
      ircOptions.channels = [];
      this.on('notice', function(nick, to, text) {
        if (nick === 'NickServ') {
          return this.emit('nickserv', text);
        }
      });
      Ann.__super__.constructor.call(this, this.server, this.nick, ircOptions);
    }
    Ann.prototype.ready = function(cb, options) {
      var afterConnect, afterIdentify, afterJoinChannels, afterRegister, connect, identify, joinChannels, notregistered, register, registered, wait;
      if (cb == null) {
        cb = (function() {});
      }
      if (options == null) {
        options = this.options;
      }
      connect = __bind(function() {
        return this.connect();
      }, this);
      afterConnect = __bind(function() {
        return this.nickserv("verify register " + this.nick + " key", (function(err) {
          switch (err.name) {
            case 'notregistered':
              return notregistered();
            case 'registered':
              return registered(err);
          }
        }), notices.registeredCheck);
      }, this);
      notregistered = function(err) {
        if (options.password && options.email) {
          return register();
        } else if (options.password) {
          return cb(err);
        } else {
          return joinChannels();
        }
      };
      registered = function(err) {
        if (options.password) {
          return identify();
        } else {
          return cb(err);
        }
      };
      identify = __bind(function() {
        return this.identify(options.password, function(err) {
          if (err) {
            cb(err);
          }
          return afterIdentify();
        });
      }, this);
      afterIdentify = function() {
        return joinChannels();
      };
      register = __bind(function() {
        return this.register(options.password, options.email, function(err) {
          if (err) {
            cb(err);
          }
          return afterRegister();
        });
      }, this);
      afterRegister = function() {
        return joinChannels();
      };
      joinChannels = __bind(function() {
        return this.joinChannels(options.channels, function(err) {
          if (err) {
            cb(err);
          }
          return afterJoinChannels();
        });
      }, this);
      afterJoinChannels = function() {
        return cb();
      };
      if (options.debug) {
        this.on('raw', function(message) {
          var i, _i, _len, _ref;
          _ref = ['rpl_motd', 'rpl_motdstart', 'rpl_endofmotd', 'rpl_luserclient', 'rpl_luserop', 'rpl_luserunknown', 'rpl_luserchannels', 'rpl_luserme', '265', '266', '250', '002', '003', '004', '005', 'PING', 'NOTICE', 'err_nomotd', 'MODE', '001'];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            i = _ref[_i];
            if (message.command === i) {
              return;
            }
          }
          return console.log(message);
        });
        this.on('nickserv', function(text) {
          return console.log("'" + (clc.yellow(text)) + "'");
        });
        connect = debug(connect, blue, 'connecting...');
        afterConnect = debug(afterConnect, green, 'connected');
        notregistered = debug(notregistered, warn, 'nick not registered');
        registered = debug(registered, green, 'nick registered');
        identify = debug(identify, blue, 'identifying...');
        afterIdentify = debug(afterIdentify, green, 'identified');
        register = debug(register, blue, 'registering...');
        afterRegister = debug(afterRegister, green, 'registered');
        joinChannels = debug(joinChannels, blue, 'joining channels...');
        afterJoinChannels = debug(afterJoinChannels, green, 'channels joined');
        cb = (function(cb) {
          return function(err) {
            if (err) {
              throw err;
            }
            green('ready');
            return cb();
          };
        })(cb);
      }
      wait = function(message) {
        if (!this.checkError(notices.connect, message.command, ['raw', 'error'], wait, cb)) {
          return this.checkSuccess(notices.connect, message.command, ['raw', 'error'], wait, afterConnect);
        }
      };
      if (!NICK.test(this.nick)) {
        return makeError(cb, 'invalidnick', notices.connect.error.invalidnick.msg, [this.nick]);
      }
      this.on('raw', wait);
      this.on('error', wait);
      return connect();
    };
    Ann.prototype.checkError = function(notices, text, events, wait, cb, args) {
      var error, event, m, name, _i, _j, _len, _len2, _ref, _ref2;
      _ref = notices.error;
      for (name in _ref) {
        error = _ref[name];
        if (error.match) {
          _ref2 = error.match;
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            m = _ref2[_i];
            if (((m.test != null) && m.test(text)) || m === text) {
              for (_j = 0, _len2 = events.length; _j < _len2; _j++) {
                event = events[_j];
                this.removeListener(event, wait);
              }
              makeError(cb, name, error.msg, args);
              return true;
            }
          }
        }
      }
      return false;
    };
    Ann.prototype.checkSuccess = function(notices, text, events, wait, cb) {
      var event, m, _i, _j, _len, _len2, _ref;
      _ref = notices.success;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        m = _ref[_i];
        if (((m.test != null) && m.test(text)) || m === text) {
          for (_j = 0, _len2 = events.length; _j < _len2; _j++) {
            event = events[_j];
            this.removeListener(event, wait);
          }
          return cb();
        }
      }
      return false;
    };
    Ann.prototype.nickserv = function(msg, cb, notices, args) {
      var wait;
      wait = function(text) {
        if (!this.checkError(notices, text, ['nickserv'], wait, cb, args)) {
          return this.checkSuccess(notices, text, ['nickserv'], wait, cb);
        }
      };
      this.on('nickserv', wait);
      return this.say('NickServ', msg);
    };
    Ann.prototype.identify = function(password, cb) {
      if (!PASSWORD.test(password)) {
        return makeError(cb, 'invalidpassword', notices.identify.error.invalidpassword.msg, [password]);
      }
      return this.nickserv("identify " + password, cb, notices.identify, [this.nick]);
    };
    Ann.prototype.register = function(password, email, cb) {
      if (!PASSWORD.test(password)) {
        return makeError(cb, 'invalidpassword', notices.register.error.invalidpassword.msg, [password]);
      }
      if (!EMAIL.test(email)) {
        return makeError(cb, 'invalidemail', notices.register.error.invalidemail.msg, [email]);
      }
      return this.nickserv("register " + password + " " + email, cb, notices.register, [email]);
    };
    Ann.prototype.joinChannels = function(channels, cb) {
      return cb();
    };
    Ann.prototype.changePassword = function(password, cb) {
      if (!PASSWORD.test(password)) {
        return makeError(cb, 'invalidpassword', notices.changePassword.error.invalidpassword.msg, [password]);
      }
      return this.nickserv("set password " + password, cb, notices.changePassword, [password]);
    };
    Ann.prototype.verifyRegister = function(nick, key, cb) {
      if (!NICK.test(nick)) {
        return makeError(cb, 'invalidnick', notices.verifyRegister.error.invalidnick.msg, [nick]);
      }
      if (!KEY.test(key)) {
        return makeError(cb, 'invalidkey', notices.verifyRegister.error.invalidkey.msg, [key]);
      }
      return this.nickserv("verify register " + nick + " " + key, cb, notices.verifyRegister, [nick]);
    };
    Ann.prototype.say = function(target, msg) {
      if (!(msg != null) && this.mainChannel) {
        return Ann.__super__.say.call(this, this.mainChannel, target);
      } else {
        return Ann.__super__.say.call(this, target, msg);
      }
    };
    return Ann;
  })();
  module.exports = Ann;
}).call(this);
