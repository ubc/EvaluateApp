
const PROMISE = require('sequelize').Promise;
const EXPRESS = require('express');
const METRIC = require('../models/metric');
const SUBMETRIC = require('../models/submetric');
const RUBRIC = require('../models/rubric');
const METRIC_TYPES = require('../metric-types');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const TRANSACTION = require('../includes/transaction');
const AUTH = require('../includes/authentication');
const DEBUG = require('debug')('eval:routing');

var router = EXPRESS.Router();

router.use(function( req, res, next ) {
	if ( AUTH.is_authenticated() ) {
		next();
	} else {
		res.status(403).render('error', {
			message: "You are not authorized.",
			error: {},
		});
	}
});

router.get('/', function( req, res ) {
	METRIC.findAll().then( function( results ) {
		res.render( 'metrics/list', {
			title: "Metrics List",
			path: req.originalUrl,
			metrics: results,
		} );
	} );
});

router.get('/create', function( req, res ) {
	var promises = [];

	promises.push( RUBRIC.findAll( {
		include: [{ model: SUBMETRIC }],
	} ) );

	PROMISE.all( promises ).spread( function( rubrics ) {
		var metric = { options: {} };

		res.render( 'metrics/editor', {
			title: "Create Metric",
			path: req.originalUrl,
			metric: metric,
			metric_types: METRIC_TYPES,
			blueprints: rubrics,
		} );
	} );
});

router.get('/edit/:metric_id', function( req, res ) {
	var promises = [];

	promises.push( METRIC.findById( req.params.metric_id ) );
	promises.push( RUBRIC.findAll({
		include: [ SUBMETRIC ],
	}) );

	PROMISE.all( promises ).spread( function( metric, rubrics ) {
		if ( metric == null ) {
			res.send( "No metric #" + req.params.metric_id + " found." );
			return;
		}

		res.render('metrics/editor', {
			title: "Edit Metric",
			path: req.originalUrl,
			metric: metric,
			metric_types: METRIC_TYPES,
			blueprints: rubrics,
		});
	} );
});

function save_metric( req, res ) {
	var data = req.body;

	if ( data.id == null ) {
		DEBUG( "Saving metric", data );
		METRIC.create( data ).then( function( metric ) {
			DEBUG( "Metric created", metric.metric_id );
			res.redirect( '/metrics/edit/' + metric.metric_id );
		} );
	} else {
		metric_id = data.id;
		delete data.id;

		DEBUG( "Updating metric", metric_id, data );
		METRIC.update( data, {
			where: { metric_id: metric_id },
		} ).then( function() {
			DEBUG( "Metric updated", metric_id );
			res.redirect( '/metrics/edit/' + metric_id );
		} );
	}
}

router.post( '/edit/:metric_id', save_metric );
router.post( '/create', save_metric );

router.get( '/destroy/:metric_id', function( req, res ) {
	var metric_id = req.params.metric_id;

	METRIC.findById( metric_id ).then( function( metric ) {
		if ( metric != null ) {
			res.render( 'metrics/destroy', {
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
		res.redirect( '/metrics' );
	} );
} );

module.exports = router;
