
const FILE = require('fs');
const PASSPORT = require('passport');
const LTI = require('passport-lti');
const PROVIDER = require("ims-lti").Provider;
const CONFIG = require('../config');
const DEBUG = require('debug')('eval:auth');

PASSPORT.use( new LTI( {
	createProvider: function( req, done ) {
		var key = req.body.oauth_consumer_key;
		if ( key in CONFIG.lti_consumers ) {
			DEBUG( "Recognized LTI Consumer", key );
			var consumer = new PROVIDER( key, CONFIG.lti_consumers[key] );
			return done(null, consumer);
		} else {
			return done("Unrecognized LTI Consumer: " + key);
		}
	},
	//consumerKey: 'testconsumerkey',
	//consumerSecret: 'testconsumersecret'
	// pass the req object to callback
	// passReqToCallback: true,
	// https://github.com/omsmith/ims-lti#nonce-stores
	// nonceStore: new RedisNonceStore('testconsumerkey', redisClient)
}, function( lti, done ) {
	DEBUG( "LTI Authentication", lti );
	// LTI launch parameters
	// console.dir(lti);
	// Perform local authentication if necessary
	user = {};

	return done(null, user);
} ) );

PASSPORT.serializeUser( function( user, done ) {
	DEBUG( "User Serialize", user );
	done( null, user );
} );

PASSPORT.deserializeUser( function( user, done ) {
	DEBUG( "User Deserialize", user );
	done( null, user );
} );

var authenticate = PASSPORT.authenticate( 'lti', { failureRedirect: '/', failureFlash: true, successFlash: true } );
var user;

module.exports = {

	has_permission: function( permission ) {
		return true;
	},

	require_login: function( req, res, next ) {
		// TODO: Remove this test code.
		//req.user = true;
		//res.locals.user = req.user;
		// ---

		if (req.user) {
			DEBUG("User Is Logged In", req.user);
			user = req.user;
			next();
		} else {
			DEBUG("User is NOT logged In", req.user);
			//res.status(401).redirect("/");
			authenticate( req, res, next );
		}
	},

}
