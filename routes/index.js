
const PASSPORT = require('passport');
const EXPRESS = require('express');
const AUTH = require('../includes/authentication');
const DEBUG = require('debug')('eval:login');

var router = EXPRESS.Router();

router.use( function( req, res, next ) {
	res.locals.user = req.user;
	res.locals.account = req.account;
	next();
} );

// TODO: Remove this test path.
router.all('/flash', function(req, res, next) {
	req.flash('info', 'Flash is back!');
	req.flash('info2', 'Back for life!');
	res.redirect('/');
});


/* GET home page. */
router.all('/', function(req, res, next) {
	DEBUG("Flash", req.flash());
	res.status(200).render('login', { title: 'Login', alerts: req.flash() });
});

router.all('/login/cas',
	PASSPORT.authenticate('cas', { failureRedirect: '/', failureFlash: true, successFlash: true }),
	PASSPORT.authorize('lti', { failureRedirect: '/', failureFlash: true, successFlash: true }),
	function(req, res, next) {
		DEBUG("Got /login/cas hit", req.user, req.account);
		res.status(303).redirect('/');
	}
);

router.all('/login/saml',
	PASSPORT.authenticate('saml', { failureRedirect: '/', failureFlash: true, successFlash: true }),
	PASSPORT.authorize('lti', { failureRedirect: '/', failureFlash: true, successFlash: true }),
	function(req, res, next) {
		DEBUG("Got /login/saml hit", req.user, req.account);
		res.status(303).redirect('/');
	}
);

router.post('/logout',
	function(req, res, next) {
		res.status(200).send('TODO Implement this.');
	}
);

module.exports = router;
