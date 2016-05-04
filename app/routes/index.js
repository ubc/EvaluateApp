
const EXPRESS = require('express');
const PROMISE = require('sequelize').Promise;
const METRIC = require('../models/metric');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const TRANSACTION = require('../includes/transaction');
const LRS = require('../includes/lrs');
const CONFIG = require('../config');
const UTIL = require('../includes/util');
const DEBUG_VOTE = require('debug')('eval:voting');

var router = EXPRESS.Router();

router.get( '/auth/:api_key', function( req, res, next ) {
	if ( UTIL.is_missing_attributes( ['path', 'payload'], req.query, res ) ) { return; }
	/*/ These lines are useful for testing, but should not be generally enabled.
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	//*/

	req.query.payload.api_key = req.params.api_key;

	var transaction_id = TRANSACTION.create( req.query.path, req.query.payload );
	res.status(201).send( transaction_id );
} );

router.post( '/vote/:transaction_id', function( req, res, next ) {
	if ( UTIL.is_missing_attributes( ['metric_id', 'user_id', 'context_id'], req.params.transaction, res ) ) { return; }
	var data = req.params.transaction;
	var new_value = req.body.vote;

	METRIC.findById( data.metric_id ).then( function( metric ) {
		var promises = [];

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

		if ( metric.type.has_submetrics === true ) {
			promises.push( SUBMETRIC.findAll( {
				where: { blueprint_id: metric.options.blueprint },
			} ) );
		}

		PROMISE.all( promises ).spread( function( vote, score_result, submetrics ) {
			DEBUG_VOTE( "Setting Vote", "to", new_value == null ? "null" : new_value, "for", metric.metric_id, "with", submetrics != null ? submetrics.length : 0, "submetrics." );

			var score = score_result[0];
			var old_value = ( vote == null ? null : vote.value );

			new_value = metric.type.validate_vote( new_value, metric, submetrics );
			DEBUG_VOTE( "Validated Vote", "As", new_value );

			if ( new_value != old_value ) {
				metric.type.adjust_score( score, new_value, old_value, metric, submetrics );
				DEBUG_VOTE( "Adjusted Score", "To", score );

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

				LRS.send_vote( {
					metric_id: data.metric_id,
					context_id: data.context_id,
					user_id: data.user_id,
					score: score,
					vote: new_value,
					meta: req.params.transaction.lrs,
				} );
			}

			res.status(200).json( {
				transaction_id: TRANSACTION.renew( req.params.transaction_id ),
				score: score.display,
				score_data: score.data,
				vote: new_value,
				total: score.count,
			} );
		} );
	} );
} );

router.get( '/embed/:transaction_id', function( req, res ) {
	if ( UTIL.is_missing_attributes( ['metric_id'], req.params.transaction, res ) ) { return; }
	var params = req.params.transaction;
	var promises = [];

	promises.push( METRIC.findById( params.metric_id ) );

	if ( params.context_id ) {
		promises.push( SCORE.findOne( {
			attributes: ['count', 'display', 'data'],
			where: { 
				metric_id: params.metric_id,
				context_id: params.context_id,
			},
		} ) );
	}

	if ( params.user_id ) {
		promises.push( VOTE.findOne( {
			attributes: ['value'],
			where: { 
				metric_id: params.metric_id,
				context_id: params.context_id,
				user_id: params.user_id,
			},
		} ) );
	}

	PROMISE.all( promises ).spread( function( metric, score, user_vote ) {
		if ( metric == null || metric.api_key != params.api_key ) {
			res.status(404).send( "The requested metric does not exist." );
			return;
		}

		var data = {
			metric: metric,
			score: ( score != null ? score : {} ),
		};

		if ( params.user_id ) {
			if ( params.preview != 'preview' ) {
				data.transaction_id = TRANSACTION.create( "/vote", params );
			}
			
			data.user_vote = user_vote != null ? user_vote.value : "";
		}

		var type_slug = metric.type.slug;

		if ( metric.type.has_submetrics === true ) {
			SUBMETRIC.findAll( {
				where: { blueprint_id: metric.options['blueprint'] },
			} ).then( function( submetrics ) {
				data['submetrics'] = submetrics;
				res.status(200).render( "metrics/single", data );
			} );
		} else {
			res.status(200).render( "metrics/single", data );
		}
	})
} );

module.exports = router;
