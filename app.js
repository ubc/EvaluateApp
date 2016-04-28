
// TODO: Remove this test code.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const EXPRESS = require('express');
const PATH = require('path');
const FAVICON = require('serve-favicon');
const LOGGER = require('morgan');
const COOKIEPARSER = require('cookie-parser');
const BODYPARSER = require('body-parser');

const DEBUG = require('debug')('eval:general');
const MODELS = require('./models');
const UTIL = require('./includes/util');

const ROUTES = require('./routes/index');
const METRICS = require('./routes/metrics');
const BLUEPRINTS = require('./routes/blueprints');
const DATA = require('./routes/data');

MODELS.install();

var app = EXPRESS();

// view engine setup
app.set( 'views', PATH.join( __dirname, 'views' ) );
app.set( 'view engine', 'jade' );

// uncomment after placing your favicon in /public
//app.use(FAVICON(PATH.join(__dirname, 'public', 'favicon.ico')));
app.use( LOGGER('dev') );
app.use( COOKIEPARSER() );
app.use( BODYPARSER.json() );
app.use( BODYPARSER.urlencoded( { extended: true } ) );
app.use( require('less-middleware')( '/less', {
	dest: '/stylesheets',
	pathRoot: PATH.join(__dirname, 'public')
} ) );
app.use( EXPRESS.static( PATH.join( __dirname, 'public' ) ));

var routers = {
	'/': require('./routes/index'),
	'/data': require('./routes/data'),
	'/metrics': require('./routes/metrics'),
	'/blueprints': require('./routes/blueprints'),
	'/xapi': require('./routes/xapi'),
};

Object.keys( routers ).forEach( function( path ) {
	app.use( path, routers[path] );
	routers[path].param( 'transaction_id', UTIL.parse_transaction_id );
	routers[path].param( 'api_key', UTIL.parse_api_key );
} );

// Catch 404 and forward to error handler
app.use( function(req, res, next) {
	var err = new Error( "Not Found: " + req.originalUrl );
	err.status = 404;
	next(err);
} );

app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	DEBUG( "Error", err.message, err.stack );
	res.end( err.message );
});

module.exports = app;
