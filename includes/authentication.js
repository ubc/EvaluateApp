
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
	callbackUrl: 'http://localhost:3000/api/saml',
	// URL of Identity Provider
	entryPoint: 'https://idp.testshib.org/idp/profile/SAML2/Redirect/SSO',
	// Public Key of Identity Provider
	cert: 'MIIEDjCCAvagAwIBAgIBADANBgkqhkiG9w0BAQUFADBnMQswCQYDVQQGEwJVUzEVMBMGA1UECBMMUGVubnN5bHZhbmlhMRMwEQYDVQQHEwpQaXR0c2J1cmdoMREwDwYDVQQKEwhUZXN0U2hpYjEZMBcGA1UEAxMQaWRwLnRlc3RzaGliLm9yZzAeFw0wNjA4MzAyMTEyMjVaFw0xNjA4MjcyMTEyMjVaMGcxCzAJBgNVBAYTAlVTMRUwEwYDVQQIEwxQZW5uc3lsdmFuaWExEzARBgNVBAcTClBpdHRzYnVyZ2gxETAPBgNVBAoTCFRlc3RTaGliMRkwFwYDVQQDExBpZHAudGVzdHNoaWIub3JnMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArYkCGuTmJp9eAOSGHwRJo1SNatB5ZOKqDM9ysg7CyVTDClcpu93gSP10nH4gkCZOlnESNgttg0r+MqL8tfJC6ybddEFB3YBo8PZajKSe3OQ01Ow3yT4I+Wdg1tsTpSge9gEz7SrC07EkYmHuPtd71CHiUaCWDv+xVfUQX0aTNPFmDixzUjoYzbGDrtAyCqA8f9CN2txIfJnpHE6q6CmKcoLADS4UrNPlhHSzd614kR/JYiks0K4kbRqCQF0Dv0P5Di+rEfefC6glV8ysC8dB5/9nb0yh/ojRuJGmgMWHgWk6h0ihjihqiu4jACovUZ7vVOCgSE5Ipn7OIwqd93zp2wIDAQABo4HEMIHBMB0GA1UdDgQWBBSsBQ869nh83KqZr5jArr4/7b+QazCBkQYDVR0jBIGJMIGGgBSsBQ869nh83KqZr5jArr4/7b+Qa6FrpGkwZzELMAkGA1UEBhMCVVMxFTATBgNVBAgTDFBlbm5zeWx2YW5pYTETMBEGA1UEBxMKUGl0dHNidXJnaDERMA8GA1UEChMIVGVzdFNoaWIxGTAXBgNVBAMTEGlkcC50ZXN0c2hpYi5vcmeCAQAwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQUFAAOCAQEAjR29PhrCbk8qLN5MFfSVk98t3CT9jHZoYxd8QMRLI4j7iYQxXiGJTT1FXs1nd4Rha9un+LqTfeMMYqISdDDI6tv8iNpkOAvZZUosVkUo93pv1T0RPz35hcHHYq2yee59HJOco2bFlcsH8JBXRSRrJ3Q7Eut+z9uo80JdGNJ4/SJy5UorZ8KazGj16lfJhOBXldgrhppQBb0Nq6HKHguqmwRfJ+WkxemZXzhediAjGeka8nz8JjwxpUjAiSWYKLtJhGEaTqCYxCCX2Dw+dOTqUzHOZ7WKv4JXPK5G/Uhr8K/qhmFT2nIQi538n6rVYLeWj8Bbnl+ev0peYzxFyF5sQA==',
	// Our private key
	privateCert: FILE.readFileSync( __dirname + '/certs/evaluate.key', 'utf-8'),
	// Also our private key, but for a different purpose
	decryptionPvk: FILE.readFileSync( __dirname + '/certs/evaluate.key', 'utf-8'),
	// The unique identifier we gave to the Identity Provider
	issuer: 'evaluate',
	// Not sure what this does, but we get an error if it's not there.
	identifierFormat: null,
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
		ssoBaseURL: 'https://cas-test.ucdavis.edu/cas/',
		serverBaseURL: 'http://localhost:3000/'
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

}
