'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var Bar = new Schema({
  yelp_id: String,
  guestList: [{
    user_id: String,
    userDate: Date
  }],
  name: String
});

module.exports = mongoose.model('Bar', Bar);