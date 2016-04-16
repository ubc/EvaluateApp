
const FILE = require('fs');
const PASSPORT = require('passport');
//const SAML = require('passport-saml').Strategy;
//const CAS = require('passport-cas').Strategy;
const LTI = require('passport-lti');
const CONFIG = require('../config');
const DEBUG = require('debug')('eval:auth');

// Useful tools for SAML integrations
// https://www.samltool.com/self_signed_certs.php
// https://www.samltool.com/sp_metadata.php

/*
PASSPORT.use( new SAML( {
	callbackUrl: 'http://localhost:3000/login/saml',
	// URL of Identity Provider
	entryPoint: 'https://idp.testshib.org/idp/profile/SAML2/Redirect/SSO',
	// Public Key of Identity Provider
	cert: FILE.readFileSync( __dirname + '/certs/idp.cert', 'utf-8'),
	// Our private key
	privateCert: FILE.readFileSync( __dirname + '/certs/evaluate.key', 'utf-8'),
	// Also our private key, but for a different purpose
	decryptionPvk: FILE.readFileSync( __dirname + '/certs/evaluate.key', 'utf-8'),
	// The unique identifier we gave to the Identity Provider
	issuer: 'evaluate',
	// Some other stuff...
	identifierFormat: null,
	validateInResponseTo: true,
},
function( profile, done ) {
	DEBUG( "SAML Authentication" );
	// Do something
	done( null, profile );
} ) );

PASSPORT.use( new CAS( {
	version: "CAS1.0",
	ssoBaseURL: 'https://192.168.33.10/cas',
	serverBaseURL: 'http://localhost:3000/',
}, function( profile, done ) {
	DEBUG( "CAS Authentication" );
	// Do something
	done( null, profile );
} ) );
*/

PASSPORT.use( new LTI( {
		/*createProvider: function( req, done ) {
			var key = req.body.oauth_consumer_key;
			if ( key in CONFIG.lti_consumers ) {
                var consumer = new LTI.Provider( key, CONFIG.lti_consumers[key] );
                DEBUG( "Recognized LTI Consumer", key )
                return done(null, consumer);
			} else {
				return done("Unrecognized LTI Consumer: " + key);
			}
		},*/
		consumerKey: 'testconsumerkey',
		consumerSecret: 'testconsumersecret'
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
	} )
);

PASSPORT.serializeUser( function( user, done ) {
	DEBUG( "User Serialize", user );
	done( null, user );
} );

PASSPORT.deserializeUser( function( user, done ) {
	DEBUG( "User Deserialize", user );
	done( null, user );
} );

var authenticate = PASSPORT.authenticate( 'lti', { failureRedirect: '/', failureFlash: true, successFlash: true } );

module.exports = {
	
	is_authenticated: function() {
		return true;
	},

	has_permission: function(permission) {
		return true;
	},

	require_login: function( req, res, next ) {
		// TODO: Remove this test code.
		//req.user = true;
		//res.locals.user = req.user;
		// ---

		if (req.user) {
			DEBUG("User Is Logged In", req.user);
			next();
		} else {
			DEBUG("Logging in User", req.user);
			authenticate( req, res, next );
		}
	},

}
