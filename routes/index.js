
const EXPRESS = require('express');

var router = EXPRESS.Router();

router.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
	res.render('index', { title: 'Login' });
});

module.exports = router;
