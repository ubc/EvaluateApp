
/**
 * This module handles requests to all the `/metrics/*` paths.
 * For detailed information on these paths, see `documentation/Developer.md`
 */

const PROMISE = require('sequelize').Promise;
const EXPRESS = require('express');
const METRIC = require('../models/metric');
const SUBMETRIC = require('../models/submetric');
const BLUEPRINT = require('../models/blueprint');
const METRIC_TYPES = require('../metric-types');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const TRANSACTION = require('../includes/transaction');
const UTIL = require('../includes/util');
const DEBUG = require('debug')('eval:metrics');

var router = EXPRESS.Router();

// Sort a list of contexts, given a valid api key.
router.get( '/sort/:api_key', function( req, res ) {
	/*/ These lines are useful for testing, but should not be generally enabled.
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	//*/

	// Check that the required attributes have been given.
	if ( UTIL.is_missing_attributes( ['metric_id', 'contexts'], req.query, res ) ) { return; }
	// Pull out the metric id to sort by.
	var metric_id = req.query.metric_id;
	// Pull out the contexts that need sorting.
	var contexts = req.query.contexts;

	// Request the scores that correspond to each context, sorted by their 'sorting' value.
	SCORE.findAll( {
		attributes: [ 'context_id' ],
		where: {
			metric_id: metric_id,
			context_id: {
				$in: contexts,
			},
		},
		order: [ [ 'sorting', 'ASC' ] ],
	} ).then( function( results ) {
		// TODO: Place the unscored metrics in this sorting.
		// Extract just the context_ids and put them in a list.
		var sorted_contexts = [];

		for ( var i = results.length - 1; i >= 0; i-- ) {
			sorted_contexts.push( results[i].context_id );
		};

		// Return the sorted contexts.
		res.status(200).send( sorted_contexts );
	} );
} );

// Get a list of all metrics associated with a given api key.
router.get( '/list/:api_key', function( req, res ) {
	// Request the metrics from the database.
	METRIC.findAll( {
		where: { api_key: req.params.api_key },
	} ).then( function( results ) {
		// Send the metrics to the client.
		res.status(200).json( results );
	} );
} );

// Renders the metric editor, given a valid transaction id.
router.get( '/edit/:transaction_id', function( req, res ) {
	// Check that the required attributes are in the transaction data.
	if ( UTIL.is_missing_attributes( ['metric_id'], req.params.transaction, res ) ) { return; }
	// Pull out the metric id for the metric we want to edit.
	var metric_id = req.params.transaction.metric_id;
	// Pull out the API key.
	var api_key = req.params.transaction.api_key;

	var promises = [];

	// Request a list of all blueprints, including their submetrics, for use in the editor.
	promises.push( BLUEPRINT.findAll( {
		where: { api_key: api_key },
		include: [ SUBMETRIC ],
	} ) );

	// If we are editing an existing metric (as opposed to creating a new one), request that Metric from the database.
	if ( metric_id ) {
		promises.push( METRIC.findById( metric_id ) );
	}

	// Wait for database requests to complete.
	PROMISE.all( promises ).spread( function( blueprints, metric ) {
		if ( ( metric_id && metric == null ) || ( metric != null && metric.api_key != api_key ) ) {
			// If the request metric doesn't exist, or the api key doesn't match, return an error.
			res.status(404).send("The requested metric does not exist.");
		} else {
			// Data for the transactions that will allow the client to save/destroy the metric.
			var transaction_data = {
				metric_id: metric_id,
				api_key: api_key,
			};

			// The actual transactions.
			var transactions = {
				submit_id: TRANSACTION.create( "/metrics/save", transaction_data ),
				delete_id: TRANSACTION.create( "/metrics/destroy", transaction_data ),
				embed_id: TRANSACTION.create( "/embed", transaction_data ), // This one is for embedding the metric preview.
			};

			// Render the metric editor.
			res.status(200).render( 'metrics/editor', {
				title: metric != null ? "Edit Metric" : "Create Metric",
				transactions: transactions,
				metric: metric != null ? metric : { options: {} },
				metric_types: METRIC_TYPES,
				blueprints: blueprints,
			} );
		}
	} );
} );

// Saves or create a metric, given a valid transaction.
router.post( '/save/:transaction_id', function( req, res ) {
	// Pull out the metric id.
	var metric_id = req.params.transaction.metric_id || null;
	// Get the data to update this metric with.
	var data = req.body;

	if ( metric_id == null ) {
		// If the metric id is not defined, we will create a new metric.
		DEBUG( "Creating Metric", data );

		// Add the current api key to this metric's data, so that they are associated.
		data.api_key = req.params.transaction.api_key;

		// Tell the database to create the metric.
		METRIC.create( data ).then( function( metric ) {
			// When successful renew the transaction to allow the client to continue editing, and return that transaction.
			DEBUG( "Metric Created", metric.metric_id );
			var transaction_id = TRANSACTION.renew( req.params.transaction_id, { metric_id: metric.metric_id } );
			res.status(201).json( { transaction_id: transaction_id } );
		} );
	} else {
		DEBUG( "Updating Metric", metric_id, data );
		
		METRIC.update( data, {
			where: {
				metric_id: metric_id
				api_key: req.params.transaction.api_key,
			},
		} ).then( function( result ) {
			if ( result[0] == 0 ) {
				// If no rows were affected return an error.
				res.status(404).send( "The metric you attempted to update does not exist." );
			} else {
				// When successful renew the transaction to allow the client to continue editing, and return that transaction.
				DEBUG( "Metric Updated", metric_id );
				var transaction_id = TRANSACTION.renew( req.params.transaction_id );
				res.status(200).json( { transaction_id: transaction_id } );
			}
		} );
	}
} );

// Destroys a metric, given a valid transaction id.
router.post( '/destroy/:transaction_id', function( req, res ) {
	// Check that the required variables are in the transaction.
	if ( UTIL.is_missing_attributes( ['metric_id'], req.params.transaction, res ) ) { return; }
	// Extract the metric id.
	var metric_id = req.params.transaction.metric_id;
	// Extract the api key.
	var api_key = req.params.transaction.api_key;
	
	// Tell the database to destroy the metric.
	METRIC.destroy( {
		where: {
			metric_id: metric_id
			api_key: api_key,
		},
	} ).then( function( affected_row_count ) {
		DEBUG( "Destroyed Metric", req.params.transaction.metric_id );
		// Related Vote and Score objects wil be destroyed via cascade.
	} );
	
	// Tell the client that the destruction has been requested.
	res.status(202).send("inprogress");
} );

module.exports = router;
