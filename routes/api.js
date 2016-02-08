
const PROMISE = require("sequelize").Promise;
const EXPRESS = require('express');
const METRIC = require('../models/metric');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const DEBUG_VOTE = require('debug')('eval:voting');
const TRANSACTION = require('../includes/transaction');

var router = EXPRESS.Router();

router.post('/vote/:id', function(req, res, next) {
	DEBUG_VOTE('API CALL', "vote", req.body);
	// TODO: Add nonce check
	var data = TRANSACTION.redeem( req.body.transaction_id, "vote" );
	var new_value = req.body.vote;

	if ( data == false ) {
		// This means that the transaction authorization failed.
		res.json( "Nonce check failed. Your session may have expired, try refreshing the page." ); // Return a failure.
		return;
	}

	var promises = [];

	promises.push( METRIC.findById( data.metric_id ) );

	promises.push( VOTE.findOne( {
		attributes: ['id', 'value'],
		where: { 
			metric_id: data.metric_id,
			context_id: data.context_id,
			user_id: data.user_id,
		},
	} ) );

	promises.push( SCORE.findOrInitialize( {
		where: { 
			metric_id: data.metric_id,
			context_id: data.context_id,
		},
	} ) );

	PROMISE.all(promises).spread( function( metric, vote, score_result ) {
		DEBUG_VOTE( "Setting vote", "to", new_value == null ? "null" : new_value, "for", metric.metric_id );

		var score = score_result[0];
		var old_value = ( vote == null ? null : vote.value );

		new_value = metric.type.validate_vote( new_value, old_value, metric );

		if ( new_value != old_value ) {
			metric.type.adjust_score( score, new_value, old_value, metric );

			if ( old_value == null ) {
				VOTE.create( {
					metric_id: data.metric_id,
					context_id: data.context_id,
					user_id: data.user_id,
					value: new_value,
				} );
			} else if ( new_value == null ) {
				vote.destroy();
			} else {
				vote.value = new_value;
				vote.save();
			}

			score.save();
		}

		res.json( {
			transaction_id: TRANSACTION.create( TRANSACTION.TYPE.VOTE, data, TRANSACTION.DURATION.ONE_DAY ), // TODO: Send a new nonce
			score: score.display,
			vote: new_value,
		} );
	})
});

module.exports = router;
