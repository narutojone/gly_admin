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
  if (!verify) { throw new TypeError('Facebook Strategy requires a verify callback'); }
  
  passport.Strategy.call(this);
  this.name = 'facebook';
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
  var facebookId = lookup(req.body, 'facebookId') || lookup(req.query, 'facebookId');
  var accessToken = lookup(req.body, 'facebookToken') || lookup(req.query, 'facebookToken');
  var expireDate = lookup(req.body, 'expireDate') || lookup(req.query, 'expireDate');
  
  if (!facebookId || !accessToken) {
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
      this._verify(req, facebookId, accessToken, expireDate, verified);
    } else {
      this._verify(facebookId, accessToken, expireDate, verified);
    }
  } catch (ex) {
    return self.error(ex);
  }
};


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
