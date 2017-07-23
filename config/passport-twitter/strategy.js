/**
 * Module dependencies.
 */
var passport = require('passport')
  , util = require('util')
  , lookup = require('./utils').lookup;

function Strategy(options, verify) {
  if (typeof options == 'function') {
    verify = options;
    options = {};
  }
  if (!verify) { throw new TypeError('Twitter Strategy requires a verify callback'); }
  
  passport.Strategy.call(this);
  this.name = 'twitter';
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy);

/**
 * Authenticate request based on the contents of a form submission.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req, options) {
  options = options || {};
  var twitterId = lookup(req.body, 'twitterId') || lookup(req.query, 'twitterId');
  var screenName = lookup(req.body, 'screenName') || lookup(req.query, 'screenName');
  var authToken = lookup(req.body, 'authToken') || lookup(req.query, 'authToken');
  var authTokenSecret = lookup(req.body, 'authTokenSecret') || lookup(req.query, 'authTokenSecret');
  
  if (!twitterId || !screenName || !authToken || !authTokenSecret) {
    return this.fail({ message: options.badRequestMessage || 'Missing credentials' }, 400);
  }
  var self = this;
  
  function verified(err, user, info) {
    if (err) { return self.error(err); }
    if (!user) { return self.fail(info); }
    self.success(user, info);
  }
  
  try {
    if (self._passReqToCallback) {
      this._verify(req, twitterId, screenName, authToken, authTokenSecret, verified);
    } else {
      this._verify(twitterId, screenName, authToken, authTokenSecret, verified);
    }
  } catch (ex) {
    return self.error(ex);
  }
};


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
