
const PROMISE = require("sequelize").Promise;
const EXPRESS = require('express');
const METRIC = require('../models/metric');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const TRANSACTION = require('../includes/transaction');

var router = EXPRESS.Router();

router.get('/:id/:user_id', function( req, res, next ) {
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

	PROMISE.all( promises ).spread( function( metric, user_vote, score ) {
		var transaction_id = TRANSACTION.create( TRANSACTION.TYPE.VOTE, {
			metric_id: metric.metric_id,
			context_id: "context",
			user_id: req.params.user_id,
		}, TRANSACTION.DURATION.ONE_DAY );

		res.render( 'metrics/' + metric.type.slug, {
			transaction_id: transaction_id,
			metric: metric,
			user_vote: user_vote != null ? user_vote.value : "",
			score: {
				display: score != null ? score.display : "0",
			},
		} );
	})
});

module.exports = router;
