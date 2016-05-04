
// This line is useful when testing, but otherwise should remain commented out.
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const EXPRESS = require('express');
const PATH = require('path');
const FAVICON = require('serve-favicon');
const LOGGER = require('morgan');
const COOKIEPARSER = require('cookie-parser');
const BODYPARSER = require('body-parser');

const MODELS = require('./models');
const UTIL = require('./includes/util');

const ROUTES = require('./routes/index');
const METRICS = require('./routes/metrics');
const BLUEPRINTS = require('./routes/blueprints');
const DATA = require('./routes/data');

// Link and initialize all database models.
MODELS.install();

// Create the Express app.
var app = EXPRESS();

// Set up the views engine, using Jade
app.set( 'views', PATH.join( __dirname, 'views' ) );
app.set( 'view engine', 'jade' );

// Define Middleware
app.use( FAVICON( PATH.join( __dirname, 'public', 'favicon.ico' ) ) );

if ( CONFIG.http_logging ) {
	app.use( LOGGER( CONFIG.http_logging ) );
}

app.use( COOKIEPARSER() );
app.use( BODYPARSER.json() );
app.use( BODYPARSER.urlencoded( { extended: true } ) );
app.use( require('less-middleware')( '/less', {
	dest: '/stylesheets',
	pathRoot: PATH.join(__dirname, 'public')
} ) );
app.use( EXPRESS.static( PATH.join( __dirname, 'public' ) ));

// Get all the http routes.
var routers = {
	'/': require('./routes/index'),
	'/data': require('./routes/data'),
	'/metrics': require('./routes/metrics'),
	'/blueprints': require('./routes/blueprints'),
	'/xapi': require('./routes/xapi'),
};

// Initialize the http routes.
Object.keys( routers ).forEach( function( path ) {
	app.use( path, routers[path] );

	// Add the transaction and api key handlers.
	routers[path].param( 'transaction_id', UTIL.parse_transaction_id );
	routers[path].param( 'api_key', UTIL.parse_api_key );
} );

// Catch 404 and forward to error handler
app.use( function( req, res, next ) {
	// If the request hasn't been handled by now that means it is a 404.
	// Generate an error.
	var err = new Error( "Not Found: " + req.originalUrl );
	err.status = 404;
	// Send the error on.
	next(err);
} );

// Error handler.
app.use( function( err, req, res, next ) {
	res.status( err.status || 500 );
	console.error( "Error", err.message, err.stack );
	res.end( err.message );
} );

module.exports = app;
