'use strict';

const express = require('express');
const mongoose = require('mongoose');
const routes = require('./app/routes/index.js');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
require('./app/config/passport')(passport);

mongoose.connect(process.env.MONGO_URI);

app.use('/common', express.static(process.cwd() + '/app/common'));
app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set("views", process.cwd() + "/views/");

app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

routes(app, passport);

// listen for requests :)
let listener = app.listen(process.env.PORT);