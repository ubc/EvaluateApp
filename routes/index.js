
const PASSPORT = require('passport');
const EXPRESS = require('express');
const AUTH = require('../includes/authentication');
const DEBUG = require('debug')('eval:login');

var router = EXPRESS.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('login', { title: 'Login' });
});

router.all('/login/cas',
	PASSPORT.authenticate('cas', { failureRedirect: '/login', failureFlash: true }),
	function(req, res, next) {
		DEBUG("Got /login/cas hit");
		res.redirect('/');
	}
);

router.all('/login/saml',
	PASSPORT.authenticate('saml', { failureRedirect: '/login', failureFlash: true }),
	function(req, res, next) {
		DEBUG("Got /login/saml hit");
		res.redirect('/');
	}
);

router.post('/logout',
	function(req, res, next) {
		res.send('TODO Implement this.');
	}
);

module.exports = router;
