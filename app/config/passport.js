'use strict';

const TwitterStrategy = require('passport-twitter').Strategy;
var User = require('../models/users.js');
var configAuth = require('./auth');

module.exports = function (passport) {
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
      done(null, user);
    });
  });
  
  passport.use(new TwitterStrategy({
    consumerKey: configAuth.twitterAuth.consumerKey,
		consumerSecret: configAuth.twitterAuth.consumerSecret,
    callbackURL: configAuth.twitterAuth.callbackURL
  }, function (token, refreshToken, profile, done) {
    var userId = profile._json.id_str;
		process.nextTick(function () {
			User.findOne({ 'twitter.id': userId }, function (err, user) {
				if (err) {
					return done(err);
				}

				if (user) {
					return done(null, user);
				} else {
          var newUser = new User();
          
          newUser.twitter.id = userId;
          newUser.twitter.iconURL = profile._json.profile_image_url_https
          newUser.twitter.displayName = profile.displayName;
          
          newUser.save(function(err) {
            if (err) {
              throw err;
            }
            
            return done(null, newUser);
          });
        }
			});
		});
	}));
};