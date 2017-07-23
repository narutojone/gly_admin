
/*
 * GET home page.
 */

var passport = require('passport')

exports.showLogin = function(req, res) {
	if(req.user){
	    // already logged in
	    res.redirect('/dashboard');
	} else {
	    // not logged in, show the login form, remember to pass the message
	    // for displaying when error happens
	    res.render('login', { message: req.session.message });
	    // and then remember to clear the message
	    req.session.message = null;
	}
};

exports.postLogin = function(req, res, next) {
  // ask passport to authenticate
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      // if error happens
      return next(err);
    }
    
    if (!user) {
      // if authentication fail, get the error message that we set
      // from previous (info.message) step, assign it into to
      // req.session and redirect to the login page again to display
      req.session.message = {error: info.message};
      return res.redirect('/login');
    }

    // if everything's OK
    req.logIn(user, function(err) {
      if (err) {
        req.session.message = {error: "Error"};
        return next(err);
      }

      // set the message
      req.session.messages = null;
      return res.redirect('/dashboard');
    });
  })(req, res, next);
};

exports.logout = function(req, res, next) {
	if (req.isAuthenticated()){
		req.logout();
		req.session.message = {success: "Loged out successfully"};
	}
  res.redirect('/login');
};


exports.validateAuth = function (req, res, next) {
	// check if the user is logged in
	if (!req.isAuthenticated()){
		req.session.message = {warning: "First you need to login to continue"};
		res.redirect('/login');
	}
  else {
    next();
  }
};
