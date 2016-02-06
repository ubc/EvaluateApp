
const PROMISE = require("sequelize").Promise;
const EXPRESS = require('express');
const METRIC = require('../models/metric');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const DEBUG_VOTE = require('debug')('eval:voting');
//const NONCE = require('../includes/nonce');

var router = EXPRESS.Router();

router.post('/vote/:id', function(req, res, next) {
	DEBUG_VOTE('API CALL', "vote", req.body);
	// TODO: Add nonce check
	//NONCE.check()

	var post = req.body;
	var promises = [];

	promises.push( METRIC.findById( post.metric_id ) );

	promises.push( VOTE.findOne( {
		attributes: ['id', 'value'],
		where: { 
			metric_id: post.metric_id,
			context_id: post.context_id,
			user_id: post.user_id,
		},
	} ) );

	promises.push( SCORE.findOrInitialize( {
		where: { 
			metric_id: post.metric_id,
			context_id: post.context_id,
		},
	} ) );

	PROMISE.all(promises).spread( function( metric, vote, score_result ) {
		DEBUG_VOTE( "Setting vote", "to", post.vote == null ? "null" : post.vote, "for", metric.metric_id );

		var score = score_result[0];
		var old_value = vote == null ? null : vote.value;
		var new_value = post.vote;

		new_value = metric.type.validate_vote( new_value, old_value );

		if ( new_value != old_value ) {
			metric.type.adjust_score( score, new_value, old_value, metric );

			if ( old_value == null ) {
				VOTE.create( {
					metric_id: post.metric_id,
					context_id: post.context_id,
					user_id: post.user_id,
					value: new_value,
				} );
			} else if ( new_value == null ) {
				vote.destroy();
			} else {
				vote.value = new_value;
				vote.save();
			}

			score.save({
				fields: ['count', 'sorting', 'average', 'display', 'data'],
			});
		}

		res.json( {
			// nonce: null, // TODO: Send a new nonce
			score: score.display,
			vote: new_value,
		} );
	})
});

module.exports = router;
