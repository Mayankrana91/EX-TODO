var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var homeRouter = require('./routes/home');

var app = express();

var session = require('express-session');


app.use(
  session({
    secret: "super-secret-key", 
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 10, 
      httpOnly: true,
    },
  })
);


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/home', homeRouter);

// redirect all unknown routes to login
app.use((req, res, next) => {
  return res.redirect('/auth/login');
});



app.use(function(req, res, next) {
  next(createError(404));
});


app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
