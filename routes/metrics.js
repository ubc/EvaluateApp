
var PROMISE = require("sequelize").Promise;
var EXPRESS = require('express');
var METRIC = require('../models/metric');
var VOTE = require('../models/vote');
var SCORE = require('../models/score');

var router = EXPRESS.Router();

router.get('/:id/', function(req, res, next) {
	var promises = [];

	promises.push( METRIC.findById( req.params.id ) );

	promises.push( VOTE.findOne( {
		attributes: ['value'],
		where: { 
			metric_id: req.params.id,
			context_id: "context",
			user_id: "user",
		},
	} ) );

	promises.push( SCORE.findOne( { // TODO: findOneOrCreate
		attributes: ['display'],
		where: { 
			metric_id: req.params.id,
			context_id: "context",
		},
	} ) );

	PROMISE.all(promises).spread( function( metric, user_vote, score ) {
		res.render( 'metrics/' + metric.type.slug, {
			metric: metric,
			user_vote: user_vote != null ? user_vote.value : "",
			score: {
				display: score != null ? score.display : "0",
			},
		} );
	})
});

router.get('/:id/:user_id', function(req, res, next) {
	// TODO: Replace the above function with this one.
});

module.exports = router;
