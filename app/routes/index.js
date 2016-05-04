
/**
 * This module handles requests to all the root paths, which are not handled by the other files in this folder.
 * Namely `/auth`, `/vote`, `/embed`
 * For detailed information on these paths, see `documentation/Developer.md`
 */

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

// Generates a Transaction, for a given api key.
router.get( '/auth/:api_key', function( req, res, next ) {
	if ( UTIL.is_missing_attributes( ['path', 'payload'], req.query, res ) ) { return; }
	/*/ These lines are useful for testing, but should not be generally enabled.
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	//*/

	// Add the API key to this transaction's data, as most actions will need it to filter database requests.
	req.query.payload.api_key = req.params.api_key;

	// Create the transaction.
	var transaction_id = TRANSACTION.create( req.query.path, req.query.payload );

	// Send off the transaction UUID.
	res.status(201).send( transaction_id );
} );

// Save a vote for a particular user and context, given a valid transaction.
router.post( '/vote/:transaction_id', function( req, res, next ) {
	// Check that the required variables are present in the transaction.
	if ( UTIL.is_missing_attributes( ['metric_id', 'user_id', 'context_id'], req.params.transaction, res ) ) { return; }
	// Pull out the transaction data.
	var data = req.params.transaction;
	// Pull out the new vote which we want to record.
	var new_value = req.body.vote;

	// Request the metric we want to vote on from the server.
	METRIC.findById( data.metric_id ).then( function( metric ) {
		// Once we have the metric, we can request the related objects.
		var promises = [];

		// Request any previous vote made by this user for this context.
		promises.push( VOTE.findOne( {
			attributes: [ 'id', 'value' ],
			where: { 
				metric_id: data.metric_id,
				context_id: data.context_id,
				user_id: data.user_id,
			},
		} ) );

		// Request or create the score object for this context.
		promises.push( SCORE.findOrInitialize( {
			where: { 
				metric_id: data.metric_id,
				context_id: data.context_id,
			},
		} ) );

		// If this metric has submetrics, request those as well.
		if ( metric.type.has_submetrics === true ) {
			promises.push( SUBMETRIC.findAll( {
				where: { blueprint_id: metric.options.blueprint },
			} ) );
		}

		// Wait for all database requests to complete.
		PROMISE.all( promises ).spread( function( vote, score_result, submetrics ) {
			DEBUG_VOTE( "Setting Vote", "to", new_value == null ? "null" : new_value, "for", metric.metric_id, "with", submetrics != null ? submetrics.length : 0, "submetrics." );

			// We are only expecting one score.
			var score = score_result[0];
			// Get the user's old vote, if it exists.
			var old_value = ( vote == null ? null : vote.value );
			// Validate the new vote.
			new_value = metric.type.validate_vote( new_value, metric, submetrics );
			DEBUG_VOTE( "Validated Vote", "As", new_value );

			// Check if the new vote is different from the old one.
			if ( new_value != old_value ) {
				// If so, update the score object.
				metric.type.adjust_score( score, new_value, old_value, metric, submetrics );
				DEBUG_VOTE( "Adjusted Score", "To", score );

				if ( old_value == null ) {
					// If there was no old vote, create a vote object now.
					VOTE.create( {
						metric_id: data.metric_id,
						context_id: data.context_id,
						user_id: data.user_id,
						value: new_value,
					} );
				} else if ( new_value == null ) {
					// If the new vote is "no vote", remove it from the database.
					vote.destroy();
				} else {
					// Otherwise, just change the value and save the vote object.
					vote.value = new_value;
					vote.save();
				}

				// Save the score object.
				score.save();

				// Send off this event to the Learning Record Store.
				// If no LRS has been configured, then this call will simply do nothing.
				LRS.send_vote( {
					metric_id: data.metric_id,
					context_id: data.context_id,
					user_id: data.user_id,
					score: score,
					vote: new_value,
					meta: req.params.transaction.lrs,
				} );
			}

			// Send the client the new score, their confirmed vote, and also a new transaction so that they can vote again.
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

// Render a metric, given a valid transaction.
router.get( '/embed/:transaction_id', function( req, res ) {
	// Check that the required properties are in the transaction.
	if ( UTIL.is_missing_attributes( ['metric_id'], req.params.transaction, res ) ) { return; }
	// Pull out the transaction data.
	var params = req.params.transaction;
	var promises = [];

	// Request the metric we want to embed from the database.
	promises.push( METRIC.findById( params.metric_id ) );

	if ( params.context_id ) {
		// If we have a context, then request the scoring for this context.
		promises.push( SCORE.findOne( {
			attributes: ['count', 'display', 'data'],
			where: { 
				metric_id: params.metric_id,
				context_id: params.context_id,
			},
		} ) );
	}

	if ( params.user_id ) {
		// If we have a user, then also request the user's previous vote.
		promises.push( VOTE.findOne( {
			attributes: ['value'],
			where: { 
				metric_id: params.metric_id,
				context_id: params.context_id,
				user_id: params.user_id,
			},
		} ) );
	}

	// Wait for all database requests to complete.
	PROMISE.all( promises ).spread( function( metric, score, user_vote ) {
		// If the metric ID or api key do not match, return an error.
		if ( metric == null || metric.api_key != params.api_key ) {
			res.status(404).send( "The requested metric does not exist." );
			return;
		}

		// Variables to use in rendering.
		var data = {
			metric: metric,
			score: ( score != null ? score : {} ),
		};

		// Check if we have a user.
		if ( params.user_id ) {
			if ( params.preview != 'preview' ) {
				// Check that we aren't in preview mode, and if so, create a transaction for voting.
				data.transaction_id = TRANSACTION.create( "/vote", params );
			}
			
			// Set the user's old vote to be rendered.
			data.user_vote = user_vote != null ? user_vote.value : "";
		}

		// Check if the metric has submetrics
		if ( metric.type.has_submetrics === true ) {
			// If so, request them from the database.
			SUBMETRIC.findAll( {
				where: { blueprint_id: metric.options['blueprint'] },
			} ).then( function( submetrics ) {
				// Set the submetrics to be rendered.
				data.submetrics = submetrics;
				// Render the metric.
				res.status(200).render( "metrics/single", data );
			} );
		} else {
			// Render the metric.
			res.status(200).render( "metrics/single", data );
		}
	})
} );

module.exports = router;
