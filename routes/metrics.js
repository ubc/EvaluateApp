
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
const DEBUG = require('debug')('eval:routing');

var router = EXPRESS.Router({ mergeParams: true });

router.get( '/sort/:api_key', function( req, res ) {
	// TODO: Remove this test header.
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	// ---

	if ( UTIL.is_missing_attributes( ['metric_id', 'contexts'], req.query, res ) ) { return; }
	var metric_id = req.query.metric_id;
	var contexts = req.query.contexts;

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
		var sorted_contexts = [];

		for ( var i = results.length - 1; i >= 0; i-- ) {
			sorted_contexts.push( results[i].context_id );
		};

		res.status(200).send( sorted_contexts );
	} );
} );

router.get( '/list/:api_key', function( req, res ) {
	METRIC.findAll( {
		where: { api_key: req.params.api_key },
	} ).then( function( results ) {
		res.status(200).send( results );
	} );
} );

router.get( '/edit/:transaction_id', function( req, res ) {
	if ( UTIL.is_missing_attributes( ['metric_id'], req.params.transaction, res ) ) { return; }
	var metric_id = req.params.transaction.metric_id;
	var api_key = req.params.transaction.api_key;
	var promises = [];

	promises.push( BLUEPRINT.findAll( {
		where: { api_key: api_key },
		include: [ SUBMETRIC ],
	} ) );

	if ( metric_id ) {
		promises.push( METRIC.findById( metric_id ) );
	}

	PROMISE.all( promises ).spread( function( blueprints, metric ) {
		var transaction_data = {
			metric_id: metric_id,
			api_key: api_key,
		};

		var transactions = {
			submit_id: TRANSACTION.create( "/metrics/save", transaction_data ),
			delete_id: TRANSACTION.create( "/metrics/destroy", transaction_data ),
			embed_id: TRANSACTION.create( "/embed", transaction_data ),
		};

		if ( ( metric_id && metric == null ) || ( metric != null && metric.api_key != api_key ) ) {
			res.status(404).send("The requested metric does not exist.");
		} else {
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

router.post( '/save/:transaction_id', function( req, res ) {
	var metric_id = req.params.transaction.metric_id || null;
	var data = req.body;

	if ( metric_id == null ) {
		DEBUG( "Creating metric", data );
		data.api_key = req.params.transaction.api_key;

		METRIC.create( data ).then( function( metric ) {
			DEBUG( "Metric created", metric.metric_id );
			var transaction_id = TRANSACTION.renew( req.params.transaction_id, { metric_id: metric.metric_id } );
			res.status(201).json( { transaction_id: transaction_id } );
		} );
	} else {
		DEBUG( "Updating metric", metric_id, data );
		METRIC.update( data, {
			where: { metric_id: metric_id },
		} ).then( function() {
			DEBUG( "Metric updated", metric_id );
			var transaction_id = TRANSACTION.renew( req.params.transaction_id );
			res.status(200).json( { transaction_id: transaction_id } );
		} );
	}
} );

router.post( '/destroy/:transaction_id', function( req, res ) {
	if ( UTIL.is_missing_attributes( ['metric_id'], req.params.transaction, res ) ) { return; }
	var metric_id = req.params.transaction.metric_id;
	
	METRIC.destroy( {
		where: { metric_id: metric_id },
	} );

	VOTE.destroy( {
		where: { metric_id: metric_id },
	} );

	SCORE.destroy( {
		where: { metric_id: metric_id },
	} );
	
	res.status(202).send("inprogress");
} );

module.exports = router;
