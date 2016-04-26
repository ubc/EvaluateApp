
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

router.get( '/list/:api_key', function( req, res ) {
	// TODO: Filter by api key.
	METRIC.findAll().then( function( results ) {
		res.status(200).send( results );
	} );
} );

router.get( '/edit/:transaction_id', function( req, res ) {
	if ( UTIL.is_missing_attributes( ['metric_id'], req.params.transaction, res ) ) { return; }
	var metric_id = req.params.transaction.metric_id;
	var promises = [];

	promises.push( BLUEPRINT.findAll( {
		include: [ SUBMETRIC ],
	} ) );

	if ( metric_id ) {
		promises.push( METRIC.findById( metric_id ) );
	}

	PROMISE.all( promises ).spread( function( blueprints, metric ) {
		var transaction_id = TRANSACTION.create( {
			action: "/metrics/save",
			data: { metric_id: metric_id },
			duration: TRANSACTION.DURATION.ONE_HOUR,
			limit: 1,
		} );

		res.status(200).render( 'metrics/editor', {
			title: metric != null ? "Edit Metric" : "Create Metric",
			transaction_id: transaction_id,
			metric: metric != null ? metric : { options: {} },
			metric_types: METRIC_TYPES,
			blueprints: blueprints,
		} );
	} );
} );

router.post( '/save/:transaction_id', function( req, res ) {
	var metric_id = req.params.transaction.metric_id || null;
	var data = req.body;
	var transaction_params = {
		action: "/metrics/edit",
		duration: TRANSACTION.DURATION.ONE_HOUR,
		limit: 1,
	};

	if ( metric_id == null ) {
		DEBUG( "Creating metric", data );
		transaction_params.data = { metric_id: metric.metric_id };
		var transaction_id = TRANSACTION.create( transaction_params );

		METRIC.create( data ).then( function( metric ) {
			DEBUG( "Metric created", metric.metric_id );
			res.status(201).redirect( '/metrics/edit/' + transaction_id );
		} );
	} else {
		DEBUG( "Updating metric", metric_id, data );
		transaction_params.data = { metric_id: metric_id };
		var transaction_id = TRANSACTION.create( transaction_params );

		METRIC.update( data, {
			where: { metric_id: metric_id },
		} ).then( function() {
			DEBUG( "Metric updated", metric_id );
			res.status(200).redirect( '/metrics/edit/' + transaction_id );
		} );
	}
} );

router.post( '/destroy/:transaction_id', function( req, res ) {
	if ( UTIL.is_missing_attributes( ['metric_id'], req.params.transaction, res ) ) { return; }
	var metric_id = req.params.transaction.metric_id;
	var promises = [];

	promises.push( METRIC.destroy( {
		where: { metric_id: metric_id },
	} ) );

	promises.push( VOTE.destroy( {
		where: { metric_id: metric_id },
	} ) );

	promises.push( SCORE.destroy( {
		where: { metric_id: metric_id },
	} ) );
	
	// TODO: Just return immediately?
	PROMISE.all( promises ).spread( function( metric ) {
		res.status(200).end();
	} );
} );

module.exports = router;
