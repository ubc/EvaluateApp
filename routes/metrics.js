
const PROMISE = require('sequelize').Promise;
const EXPRESS = require('express');
const METRIC = require('../models/metric');
const SUBMETRIC = require('../models/submetric');
const BLUEPRINT = require('../models/blueprint');
const METRIC_TYPES = require('../metric-types');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const TRANSACTION = require('../includes/transaction');
const AUTH = require('../includes/authentication');
const DEBUG = require('debug')('eval:routing');

var router = EXPRESS.Router();

router.use( AUTH.require_login );

router.all('/', function( req, res ) {
	METRIC.findAll().then( function( results ) {
		res.status(200).render( 'metrics/list', {
			title: "Metrics List",
			path: req.originalUrl,
			metrics: results,
		} );
	} );
});

router.get('/create', function( req, res ) {
	var promises = [];

	promises.push( BLUEPRINT.findAll( {
		include: [{ model: SUBMETRIC }],
	} ) );

	PROMISE.all( promises ).spread( function( blueprints ) {
		var metric = { options: {} };

		res.status(200).render( 'metrics/editor', {
			title: "Create Metric",
			path: req.originalUrl,
			metric: metric,
			metric_types: METRIC_TYPES,
			blueprints: blueprints,
		} );
	} );
});

router.get('/edit/:metric_id', function( req, res ) {
	var promises = [];

	promises.push( METRIC.findById( req.params.metric_id ) );
	promises.push( BLUEPRINT.findAll({
		include: [ SUBMETRIC ],
	}) );

	PROMISE.all( promises ).spread( function( metric, blueprints ) {
		if ( metric == null ) {
			res.status(404).send( "No metric #" + req.params.metric_id + " found." );
			return;
		}

		res.status(200).render('metrics/editor', {
			title: "Edit Metric",
			path: req.originalUrl,
			metric: metric,
			metric_types: METRIC_TYPES,
			blueprints: blueprints,
		});
	} );
});

// TODO: Make sure this is a valid creation.
function save_metric( req, res ) {
	var data = req.body;

	if ( data.id == null ) {
		DEBUG( "Saving metric", data );
		METRIC.create( data ).then( function( metric ) {
			DEBUG( "Metric created", metric.metric_id );
			res.status(201).redirect( '/metrics/edit/' + metric.metric_id );
		} );
	} else {
		metric_id = data.id;
		delete data.id;

		DEBUG( "Updating metric", metric_id, data );
		METRIC.update( data, {
			where: { metric_id: metric_id },
		} ).then( function() {
			DEBUG( "Metric updated", metric_id );
			res.status(200).redirect( '/metrics/edit/' + metric_id );
		} );
	}
}

router.post( '/edit/:metric_id', save_metric );
router.post( '/create', save_metric );

router.get( '/destroy/:metric_id', function( req, res ) {
	var metric_id = req.params.metric_id;

	METRIC.findById( metric_id ).then( function( metric ) {
		if ( metric != null ) {
			res.status(200).render( 'metrics/destroy', {
				title: "Delete Metric",
				metric: metric,
			} );
		} else {
			res.status(404).render('error', {
				message: "There is no Metric with id #" + metric_id,
				error: {
					status: "404 Metric Not Found",
				},
			});
		}
	} );
} );

router.post( '/destroy/:metric_id', function( req, res ) {
	var metric_id = req.params.metric_id;
	var promises = [];

	promises.push( VOTE.destroy( {
		where: { metric_id: metric_id },
	} ) );

	promises.push( SCORE.destroy( {
		where: { metric_id: metric_id },
	} ) );

	promises.push( METRIC.destroy( {
		where: { metric_id: metric_id },
	} ) );
	
	PROMISE.all( promises ).spread( function() {
		res.status(303).redirect( '/metrics' );
	} );
} );

module.exports = router;
