
const PASSPORT = require('passport');
const EXPRESS = require('express');
const AUTH = require('../includes/authentication');
const CONFIG = require('../config');
const DEBUG = require('debug')('eval:login');

var router = EXPRESS.Router();

router.use( function( req, res, next ) {
	res.locals.user = req.user;
	res.locals.alerts = req.flash();

	if ( res.locals.alerts ) {
		DEBUG("Flash", res.locals.alerts);
	}

	next();
} );

/* GET home page. */
router.all('/', function(req, res, next) {
	res.status(200).render( 'index', { 
		title: CONFIG.site.title,
		details: CONFIG.site.description,
	} );
});

router.post('/login',
	PASSPORT.authenticate( 'lti', { failureRedirect: '/', failureFlash: true, successFlash: true } ),
	function( req, res, next ) {
		DEBUG("Got /login hit", req.user, req.body.target_path);
		res.status(303).redirect(req.body.target_path || '/');
	}
);

router.post('/logout',
	function( req, res, next ) {
		res.status(200).send('TODO Implement this.');
	}
);

module.exports = router;
