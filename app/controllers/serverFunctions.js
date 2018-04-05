'use strict';

const mongoose = require('mongoose');
const request = require('request');
const Users = require('../models/users.js');
const Bars = require('../models/bars.js');

// in case of mistyped address, will keep mongoose from throwing a castType error
function validateId(id, callback) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return;
  } else {
    callback();
  }
}

function checkGuestList(bar_id) {
  return new Promise((resolve, reject) => {
    Bars
      .findOne({yelp_id: bar_id})
      .exec((err, doc) => {
        if (err) { return reject(err); }
        if (doc === null) { return resolve(0); }
        return resolve(doc.guestList.length);
      });
  });
}

function getBarDocs(bar_id) {
  return new Promise((resolve, reject) => {
    Bars
      .findOne({yelp_id: bar_id})
      .exec((err, doc) => {
        if (err) { return reject(err); }
        return resolve(doc);
      });
  });
}

function userOnList(bar, user_id) {
  let guestIdArray = bar.guestList.map(obj => { return obj.user_id});
  if (guestIdArray.indexOf(user_id) !== -1) {
    return true;
  } else {
    return false;
  }
}

function ServerFunctions() {
  
  this.fetchYelpData = function (req, res, next) {
    let offset = +req.params.offset, location;
    if (offset) {
      location = req.params.location;
    } else {
      offset = 0;
      location = req.query.location;
    }
    
    if (offset + 18 >= 1000) {
      offset = 1000 - 18;
    }
    
    let loggedIn = req.isAuthenticated();
    var uri = "https://api.yelp.com/v3/businesses/search?location=" + location + "&categories=bars&limit=18&offset=" + offset + "&radius=40000";
        
    request({
      headers: {
        Authorization: "Bearer " + process.env.YELP_API_KEY
      },
      uri: uri,
      method: 'GET'
    }, function (error, response, body) {
      var barData = JSON.parse(body);
      res.locals.barData = barData;
      res.locals.location = location;
      res.locals.offset = offset;
      
      let promiseArray = barData.businesses.map(bar => {
        return getBarDocs(bar.id);
      });
      
      Promise.all(promiseArray).then(barDocs => {
        barData.businesses.forEach((bar, index) => {
          if (barDocs[index] === null) {
            bar.guests = 0;
          } else {
            bar.guests = barDocs[index].guestList.length;
            if (loggedIn) {
              console.log(barDocs[index].guestList);
              if (userOnList(barDocs[index], req.user._id.toString())) {
                bar.userAttending = true;
              }
            }
          }
        });
        return next(); 
      }).catch(err => {
        console.log('catch err', err);
        return res.json(err);
      });
      
    });
  }
  
  this.addToGuestList = function (req, res, next) {
    let name = req.params.name;
    let yelp_id = req.params.yelp_id;
    if (! req.isAuthenticated()) {
      throw new Error('User not logged in');
    }
    let user_id = req.user._id.toString();
    
    Users
      .findById(user_id, (err, user) => {
        user.barsGoingTo.push({bar_id: yelp_id.toString(), date: new Date(), barName: name});
        user.save(err => {
          if (err) { throw err; };
        });
      });
    
    Bars
      .findOne({yelp_id: yelp_id}, (err, bar) => {
        if (err) { throw err; }
        if (bar) {
          if (!userOnList(bar, user_id)) {
            bar.guestList.push({user_id: user_id, userDate: new Date()});
            bar.save(err => {
              if (err) {
                console.log('save err', err);
              }
            });
          } else {
            console.log('User already in list');
          }
        } else {
          let newBar = new Bars({
            yelp_id: yelp_id,
            guestList: { user_id: user_id, userDate: new Date()},
          });
          newBar.save((err, result) => {
            if (err) { throw err; }
            //console.log('new bar result', result);
          }) 
        }     
      
        res.redirect('back');
      });
  }
  
  this.removeFromGuestList = function (req, res, next) {
    let yelp_id = req.params.yelp_id;
    if (! req.isAuthenticated()) {
      throw new Error('User not logged in');
    }
    let user_id = req.user._id.toString();
      
    Users
      .update({_id: user_id}, {$pull: {barsGoingTo: { bar_id: yelp_id}} } )
      .exec(err => {
        if (err) { throw err; }
      });
    
    Bars
      .update({yelp_id: yelp_id}, {$pull: {guestList: { user_id: user_id } } } )
      .exec(err => {
        if (err) { throw err; }
        res.redirect('back');
      });
  }
  
}

module.exports = ServerFunctions;