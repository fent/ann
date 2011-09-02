(function() {
  var IRCError, async, c, iterateArray, join, joinFun, notices, requestFun, sayFun, sc, scFun, test;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  async = require('async');
  test = require('./regex.js');
  notices = require('./notices.js');
  IRCError = require('./IRCError.js');
  c = function(cb) {
    return cb();
  };
  iterateArray = function(object, series, f, cb) {
    var newF;
    newF = (__bind(function() {
      return f.apply(this, arguments);
    }, this));
    if (series) {
      return async.forEachSeries.call(this, object, newF, cb);
    } else {
      return async.forEach.call(this, object, newF, cb);
    }
  };
  sc = function(list, object, attr, f) {
    if (object[attr]) {
      return list[attr] = f.call(this, object[attr]);
    }
  };
  joinFun = function(object, series) {
    var list, newF;
    if (object == null) {
      object = c;
    }
    if (typeof object === 'function') {
      return object;
    } else if (Array.isArray(object)) {
      newF = __bind(function(o) {
        return joinFun.call(this, o);
      }, this);
      return __bind(function(cb) {
        return iterateArray.call(this, object, series, newF, cb);
      }, this);
    } else if (object instanceof Object) {
      list = {};
      sc.call(this, list, object, 'request', requestFun);
      sc.call(this, list, object, 'say', sayFun);
      return function(cb) {
        return async.parallel(list, __bind(function() {
          return cb.call(this, arguments);
        }, this));
      };
    } else {
      return c;
    }
  };
  scFun = function(fun) {
    return function(object, series, fun) {
      var newF;
      if (object == null) {
        object = c;
      }
      if (Array.isArray(object)) {
        newF = __bind(function(o) {
          return fun.call(this, o);
        }, this);
        return __bind(function(cb) {
          return iterateArray.call(this, object, series, newF, cb);
        }, this);
      } else if (object instanceof Object) {
        return fun.call(this, object);
      } else {
        return c;
      }
    };
  };
  requestFun = scFun(requestFun, function(object) {
    var optionalcb, _ref;
    optionalcb = (_ref = object.cb) != null ? _ref : function(cb, err) {
      return cb(err);
    };
    return __bind(function(cb) {
      return request(object, __bind(function(err, res, body) {
        return optionalcb.apply(this, [cb].concat(arguments));
      }, this));
    }, this);
  });
  sayFun = scFun(sayFun, function(object) {
    return __bind(function(cb) {
      var event, optionalcb, waitForInvite, waitForReply, _ref;
      if (test.nick(object.target) && test.channel(object.target)) {
        return new IRCError(cb, 'invalidtarget', notices.join, [object.target]);
      }
      optionalcb = (_ref = object.cb) != null ? _ref : c;
      event = "pm@" + object.target;
      if (object.waitForReply) {
        waitForReply = __bind(function(text) {
          this.removeListener(event, waitForReply);
          return optionalcb.apply(this, [cb].concat(arguments));
        }, this);
        this.on(event, waitForReply);
      }
      if (object.waitForInvite) {
        waitForInvite = __bind(function(channel, from) {
          if (from === object.target) {
            this.removeListener('invite', waitForInvite);
            if (object.waitForReply) {
              this.removeListener(event, waitForReply);
            }
            return optionalcb.apply(this, [cb].concat(arguments));
          }
        }, this);
        this.on('invite', waitForInvite);
      }
      return this.say(object.target, object.msg);
    }, this);
  });
  module.exports = function(channels, cb, series) {
    if (cb == null) {
      cb = (function() {});
    }
    this.emit('joining');
    return join(channels, function() {
      this.emit('joined');
      return cb();
    }, series);
  };
  join = function(channels, cb, series) {
    var channel, password, _ref;
    if (!channels) {
      return cb();
    } else if (typeof channels === 'string') {
      _ref = channels.split(' '), channel = _ref[0], password = _ref[1];
      if (test.channel(channel)) {
        return new IRCError(cb, 'invalidchannel', notices.join, [channel]);
      }
      if (test.channelpassword(password)) {
        return new IRCError(cb, 'invalidpassword', notices.join, [password]);
      }
      return this.join(channel, cb);
    } else if (Array.isArray(channels)) {
      return iterateArray.call(this, channels, series, this.joinChannels, cb);
    } else if (channels instanceof Object) {
      join = __bind(function(cb) {
        return this.joinChannels(channels.channels, (function(err) {
          return cb(err);
        }), channels.series || series);
      }, this);
      return async.series([joinFun.call(this, channels.prejoin), join, joinFun.call(this, channels.postjoin)], function(err, results) {
        return cb(err);
      });
    }
  };
}).call(this);
