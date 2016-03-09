
const PASSPORT = require('passport');
const SAML = require('passport-saml').Strategy;
const CAS = require('passport-cas').Strategy;
const LTI = require('passport-lti');
const DEBUG = require('debug')('eval:auth');

PASSPORT.use( new SAML( {
		path: '/login/callback',
		entryPoint: 'https://openidp.feide.no/simplesaml/saml2/idp/SSOService.php',
		issuer: 'passport-saml'
	},
	function( profile, done ) {
		DEBUG( "SAML Authentication", profile );
		findByEmail(profile.email, function(err, user) {
			if (err) {
				return done(err);
			}
			return done(null, user);
		} );
	} )
);

PASSPORT.use( new CAS( {
		ssoBaseURL: 'http://www.example.com/',
		serverBaseURL: 'http://localhost:3000'
	}, function( profile, done ) {
		DEBUG( "CAS Authentication", profile );
		User.findOne({login: login}, function (err, user) {
			if (err) {
				return done(err);
			} else if (!user) {
				return done(null, false, {message: 'Unknown user'});
			}

			return done(null, user);
		} );
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

module.exports = {
	
	is_authenticated: function() {
		return true;
	},

	has_permission: function(permission) {
		return true;
	},

}
