
const EXPRESS = require('express');
const PATH = require('path');
const FAVICON = require('serve-favicon');
const LOGGER = require('morgan');
const COOKIEPARSER = require('cookie-parser');
const BODYPARSER = require('body-parser');

const ROUTES = require('./routes/index');
const METRICS = require('./routes/metrics');
const RUBRICS = require('./routes/rubrics');
const API = require('./routes/api');
const DATA = require('./routes/data');

var app = EXPRESS();

// view engine setup
app.set('views', PATH.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(FAVICON(PATH.join(__dirname, 'public', 'favicon.ico')));
app.use(LOGGER('dev'));
app.use(BODYPARSER.json());
app.use(BODYPARSER.urlencoded({ extended: true }));
app.use(COOKIEPARSER());
app.use(require('less-middleware')(PATH.join(__dirname, 'public')));
app.use(EXPRESS.static(PATH.join(__dirname, 'public')));

app.use('/', ROUTES);
app.use('/data', DATA);
app.use('/metrics', METRICS);
app.use('/rubrics', RUBRICS);
app.use('/api', API);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
