
const EXPRESS = require('express');
const AUTH = require('../includes/authentication');

var router = EXPRESS.Router();

router.use( function( req, res, next ) {
	if ( AUTH.is_authenticated() ) {
		next();
	} else {
		res.status(403).render('error', {
			message: "You are not authorized.",
			error: {},
		});
	}
} );

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
	res.render('index', { title: 'Login' });
});

module.exports = router;
