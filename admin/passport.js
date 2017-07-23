
// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var User = require('./models/user');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy({
        // by default, local strategy uses username and password, we will override with username
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) { // callback with username and password from our form

		// find a user whose username is the same as the forms username
		// we are checking to see if the user trying to login already exists
//    console.log(user.generateHash(password));
    User.findOne({username: username}, function(err, user) {
        if (err) {
          return done(err);
        }
        if(!user)
          // if the user is not exist
          return done(null, false, {message: "The user does not exist"});
        else if (!user.validPassword(password))
          // if password does not match
          return done(null, false, {message: "Wrong password"});
        else if (user.role.indexOf('admin') < 0)
          return done(null, false, {message: "That user is not an administrator"});
        else
          // if everything is OK, return null as the error
          // and the authenticated user
          req.user = user;
          return done(null, user);
        
      });
    }));

};
