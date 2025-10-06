require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const homeRouter = require('./routes/home');
const pastRouter = require('./routes/pasttodos');
const completedRouter = require('./routes/completed');
const todayRouter = require("./routes/today");
const upcomingRouter = require("./routes/upcoming");

const app = express();

const session = require('express-session');

// ✅ Import the reminder worker correctly
const reminderWorker = require('./utils/reminderWorker');

// Start the reminder worker
reminderWorker.start();


app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
    },
  })
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/home', homeRouter);
app.use('/past', pastRouter);
app.use('/completed', completedRouter);
app.use("/today", todayRouter);
app.use("/upcoming", upcomingRouter);

app.use("/about", (req, res) => {
  const username = req.session.username || "guest";
  res.render("about", { username });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

// Restore completed task
app.post("/completed/restore", (req, res) => {
  const { taskId } = req.body;
  const username = req.session.username || "guest";

  const task = todos.find(
    (t) => t.id === taskId && t.username === username
  );

  if (task) {
    task.completed = false;
    delete task.completedAt;
  }

  res.redirect("/completed");
});

module.exports = app;
