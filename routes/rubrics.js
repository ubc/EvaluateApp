
const EXPRESS = require('express');

var router = EXPRESS.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Rubrics' });
});

module.exports = router;
