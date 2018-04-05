'use strict';

const path = process.cwd();
var ServerFunctions = require(path + '/app/controllers/serverFunctions.js');

function populateTemporary(req, res, next) {
  res.locals.loggedIn = req.isAuthenticated();
  res.locals.user = req.user;
  next();
}

module.exports = function(app, passport) {
  
  function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
      res.locals.error = 'You need to be logged in to view that page!';
			res.render('index', res.locals);
		}
  }
  
  function isGuest (req, res, next) {
		if (!req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/profile');
		}
  }
  
  var sf = new ServerFunctions();
  
  app.route('/')
    .get(isGuest, populateTemporary, (req, res) => {
      res.render('index', res.locals);
    });
  
  app.route('/logout')
    .get(function (req, res) {
      req.logout();
      res.redirect('/');
    });

  app.route('/auth/twitter')
    .get((req,res, next) => {
      req.session.returnTo = req.headers.referer;
      next();
    }, passport.authenticate('twitter'));
  
  app.route('/auth/twitter/callback')
    .get(passport.authenticate('twitter'), (req, res) => {
      res.redirect(req.session.returnTo || '/');
      delete req.session.returnTo;
    });
  
  app.route('/profile')
    .get(isLoggedIn, populateTemporary, (req, res) => {
      res.render('profile', res.locals);
    });
  
  app.route('/search')
    .get(isLoggedIn, sf.fetchYelpData, populateTemporary, (req, res) => {
        res.render('search', res.locals);
     });
  
  app.route('/search/:location/:offset')
    .get(isLoggedIn, sf.fetchYelpData, populateTemporary, (req, res) => {
      res.render('search', res.locals);
    });
  
  app.route('/guestList/add/:name/:yelp_id')
    .get(isLoggedIn, sf.addToGuestList);
  
  app.route('/guestList/remove/:yelp_id')
    .get(isLoggedIn, sf.removeFromGuestList);
}