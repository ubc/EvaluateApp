
const FILE = require('fs');
const PASSPORT = require('passport');
const SAML = require('passport-saml').Strategy;
const CAS = require('passport-cas').Strategy;
const LTI = require('passport-lti');
const DEBUG = require('debug')('eval:auth');

// Useful tools for SAML integrations
// https://www.samltool.com/self_signed_certs.php
// https://www.samltool.com/sp_metadata.php

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
	/*findByEmail(profile.email, function(err, user) {
		if (err) {
			return done(err);
		}

		return done(null, user);
	} );*/
	done( null, profile );
} ) );

PASSPORT.use( new CAS( {
		version: "CAS1.0",
		ssoBaseURL: 'https://192.168.33.10/cas',
		serverBaseURL: 'http://localhost:3000/',
	}, function( profile, done ) {
		DEBUG( "CAS Authentication" );
		/*User.findOne({login: login}, function (err, user) {
			if (err) {
				return done(err);
			} else if (!user) {
				return done(null, false, {message: 'Unknown user'});
			}

			return done(null, user);
		} );*/
		done( null, profile );
	} )
);

PASSPORT.use( new LTI( {
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

module.exports = {
	
	is_authenticated: function() {
		return true;
	},

	has_permission: function(permission) {
		return true;
	},

	require_login: function(req, res, next) {
		if (req.user) {
			DEBUG("User Is Logged In", req.user);
			next();
		} else {
			DEBUG("User Is NOT Logged In");
			res.redirect("/");
		}
	},

}
