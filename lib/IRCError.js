(function() {
  var IRCError, vsprintf;
  vsprintf = require('sprintf').vsprintf;
  module.exports = IRCError = (function() {
    function IRCError(cb, type, notice, args) {
      var err;
      if (args == null) {
        args = [];
      }
      err = new Error(vsprintf(notice.error[type].msg, args));
      err.type = type;
      err.name = 'IRCError';
      cb(err);
    }
    return IRCError;
  })();
}).call(this);
