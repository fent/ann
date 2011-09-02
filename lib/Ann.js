(function() {
  var Ann, IRCError, blue, clc, green, irc, notices, test, warn;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  irc = require('irc');
  clc = require('cli-color');
  test = require('./regex.js');
  notices = require('./notices.js');
  IRCError = require('./IRCError.js');
  blue = function(s) {
    return function() {
      return console.log(clc.bold.blue(s));
    };
  };
  green = function(s) {
    return function() {
      return console.log(clc.bold.green(s));
    };
  };
  warn = function(s) {
    return function() {
      return console.log(clc.bold.red(s));
    };
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
      this.setMaxListeners(0);
      this.on('notice', function(nick, to, text) {
        if (nick === 'NickServ') {
          return this.emit('nickserv', text);
        }
      });
      this.on('message', function(nick, to, text) {
        this.emit("message" + to + "@" + nick, text);
        return this.emit("message@" + nick, to, text);
      });
      this.on('pm', function(nick, text) {
        return this.emit("pm@" + nick, text);
      });
      Ann.__super__.constructor.call(this, this.server, this.nick, ircOptions);
    }
    Ann.prototype.connect = function(cb) {
      var wait;
      if (cb == null) {
        cb = (function() {});
      }
      this.emit('connecting');
      wait = function(message) {
        if (!this.checkError(notices.connect, message.command, ['raw', 'error'], wait, cb)) {
          return this.checkSuccess(notices.connect, message.command, ['raw', 'error'], wait, function() {
            this.emit('connected');
            return cb();
          });
        }
      };
      if (test.nick(this.nick)) {
        return new IRCError(cb, 'invalidnick', notices.connect, [this.nick]);
      }
      this.on('raw', wait);
      this.on('error', wait);
      return Ann.__super__.connect.call(this);
    };
    Ann.prototype.ready = function(cb, options) {
      var afterConnect, identify, joinChannels, register;
      if (cb == null) {
        cb = (function(err) {
          if (err) {
            throw err;
          }
        });
      }
      if (options == null) {
        options = this.options;
      }
      this.emit('connecting');
      afterConnect = __bind(function() {
        return this.isRegistered(this.nick, function(registered, err) {
          if (registered) {
            if (options.password) {
              return identify();
            } else {
              return cb(err);
            }
          } else {
            if (options.password && options.email) {
              return register();
            } else if (options.password || options.email) {
              return cb(err);
            } else {
              return joinChannels();
            }
          }
        });
      }, this);
      identify = __bind(function() {
        return this.identify(options.password, function(err) {
          if (err) {
            return cb(err);
          }
          return joinChannels();
        });
      }, this);
      register = __bind(function() {
        return this.register(options.password, options.email, function(err) {
          if (err) {
            return cb(err);
          }
          return joinChannels();
        });
      }, this);
      joinChannels = __bind(function() {
        return this.joinChannels(options.channels, cb);
      }, this);
      if (options.debug) {
        this.on('raw', function(message) {
          var i, _i, _len, _ref;
          _ref = ['rpl_motd', 'rpl_motdstart', 'rpl_endofmotd', 'rpl_luserclient', 'rpl_luserop', 'rpl_luserunknown', 'rpl_luserchannels', 'rpl_luserme', '265', '266', '250', '002', '003', '004', '005', 'PING', 'NOTICE', 'err_nomotd', 'MODE', '001', 'rpl_namreply', 'rpl_endofnames', 'rpl_channelmodeis', '329'];
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
        this.on('connect', blue('connecting...'));
        this.on('connected', green('connected'));
        this.on('identifying', blue('identifying...'));
        this.on('identified', green('identified'));
        this.on('registering', blue('registering...'));
        this.on('registered', green('registered'));
        this.on('joining', blue('joining...'));
        this.on('joined', green('joined'));
      }
      return this.connect(function(err) {
        if (err) {
          return cb(err);
        }
        return afterConnect();
      });
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
              new IRCError(cb, name, notices, args);
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
    Ann.prototype.isRegistered = function(nick, cb) {
      if (test.nick(nick)) {
        return new IRCError(cb, 'invalidnick', notices.verifyRegister, [nick]);
      }
      this.emit('checkingregistered');
      return this.nickserv("verify register " + nick + " key", (__bind(function(err) {
        switch (err.type) {
          case 'notregistered':
            this.emit('notregistered');
            return cb(false, err);
          case 'registered':
            this.emit('registered');
            return cb(true, err);
        }
      }, this)), notices.isRegistered, [nick]);
    };
    Ann.prototype.identify = function(password, cb) {
      var newcb;
      if (test.password(password)) {
        return new IRCError(cb, 'invalidpassword', notices.identify, [password]);
      }
      this.emit('identifying');
      newcb = __bind(function(err) {
        if (err) {
          return cb(err);
        }
        this.emit('identified');
        return cb();
      }, this);
      return this.nickserv("identify " + password, newcb, notices.identify, [this.nick]);
    };
    Ann.prototype.register = function(password, email, cb) {
      var newcb;
      if (test.password(password)) {
        return new IRCError(cb, 'invalidpassword', notices.register, [password]);
      }
      if (test.email(email)) {
        return new IRCError(cb, 'invalidemail', notices.register, [email]);
      }
      this.emit('registering');
      newcb = __bind(function(err) {
        if (err) {
          return cb(err);
        }
        this.emit('registered');
        return cb();
      }, this);
      return this.nickserv("register " + password + " " + email, newcb, notices.register, [email]);
    };
    Ann.prototype.changePassword = function(password, cb) {
      var newcb;
      if (test.password(password)) {
        return new IRCError(cb, 'invalidpassword', notices.changePassword, [password]);
      }
      this.emit('changingpassword');
      newcb = __bind(function(err) {
        if (err) {
          return cb(err);
        }
        this.emit('passwordchanged');
        return cb();
      }, this);
      return this.nickserv("set password " + password, newcb, notices.changePassword, [password]);
    };
    Ann.prototype.verifyRegister = function(nick, key, cb) {
      var newcb;
      if (test.nick(nick)) {
        return new IRCError(cb, 'invalidnick', notices.verifyRegister, [nick]);
      }
      if (test.key(key)) {
        return new IRCError(cb, 'invalidkey', notices.verifyRegister, [key]);
      }
      this.emit('verifying');
      newcb = __bind(function(err) {
        if (err) {
          return cb(err);
        }
        this.emit('verified');
        return cb();
      }, this);
      return this.nickserv("verify register " + nick + " " + key, newcb, notices.verifyRegister, [nick]);
    };
    return Ann;
  })();
  Ann.prototype.joinChannels = require('./join');
  module.exports = Ann;
}).call(this);
