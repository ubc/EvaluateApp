
const JADE = require('jade')
const PROMISE = require('sequelize').Promise;
const EXPRESS = require('express');
const METRIC = require('../models/metric');
const SUBMETRIC = require('../models/submetric');
const RUBRIC = require('../models/rubric');
const METRIC_TYPES = require('../metric-types');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const TRANSACTION = require('../includes/transaction');
const AUTH = require('../includes/authentication')
const DEBUG = require('debug')('eval:routing');

var router = EXPRESS.Router();

router.use(function( req, res, next ) {
	if ( AUTH.is_authenticated() || req.path.indexOf('/embed') == 0 ) {
		next();
	} else {
		res.status(403).send( "You are not authorized." );
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
			metric_types: get_metric_type_options(metric.options, rubrics),
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
			metric_types: get_metric_type_options(metric.options, rubrics),
		});
	} );
});

function get_metric_type_options(options, rubrics) {
	var results = {};

	for ( var slug in METRIC_TYPES ) {
		var data = {
			slug: slug,
			options: options,
		};

		// TODO: Refactor rubrics to avoid the name clash between the metric type and the model.
		if ( slug == 'rubric' ) {
			data['blueprints'] = rubrics;
		}

		var html = JADE.renderFile( __dirname + "/../metric-types/" + slug + "/options.jade", data );

		results[slug] = {
			title: METRIC_TYPES[slug].title,
			html: html,
		};
	}

	return results;
}

function save_metric( req, res ) {
	var data = req.body;

	// TODO: Validate the data.

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

function render_metric( res, type_slug, data ) {
	data['body'] = JADE.renderFile( __dirname + "/../metric-types/" + type_slug + "/display.jade", data );
	res.render( "metrics/single", data );
}

router.get( '/embed/:metric_id/', function( req, res ) {
	var promises = [];

	promises.push( METRIC.findById( req.params.metric_id ) );

	promises.push( SCORE.findOne( { // TODO: findOneOrCreate
		attributes: ['display', 'data'],
		where: { 
			metric_id: req.params.metric_id,
			context_id: "context",
		},
	} ) );

	PROMISE.all( promises ).spread( function( metric, score ) {
		if ( metric == null ) {
			res.status(404).send( "No metric #" + req.params.metric_id + " found." );
			return;
		}

		var data = {
			metric: metric,
			score: ( score != null ? score : {} ),
		};

		var type_slug = metric.type.slug;

		if ( metric.type.has_submetrics === true ) {
			SUBMETRIC.findAll( {
				where: { rubric_id: metric.options['blueprint'] },
			} ).then( function( submetrics ) {
				data['submetrics'] = submetrics;
				render_metric( res, type_slug, data );
			} );
		} else {
			render_metric( res, type_slug, data );
		}
	})
} );

router.get( '/embed/:metric_id/:user_id', function( req, res ) {
	var promises = [];

	promises.push( METRIC.findById( req.params.metric_id ) );

	promises.push( VOTE.findOne( {
		attributes: ['value'],
		where: { 
			metric_id: req.params.metric_id,
			context_id: "context",
			user_id: req.params.user_id,
		},
	} ) );

	promises.push( SCORE.findOne( { // TODO: findOneOrCreate
		attributes: ['display', 'data'],
		where: { 
			metric_id: req.params.metric_id,
			context_id: "context",
		},
	} ) );

	PROMISE.all( promises ).spread( function( metric, user_vote, score ) {
		if ( metric == null ) {
			res.status(404).send( "No metric #" + req.params.metric_id + " found." );
			return;
		}

		var transaction_id = TRANSACTION.create( TRANSACTION.TYPE.VOTE, {
			metric_id: metric.metric_id,
			context_id: "context",
			user_id: req.params.user_id,
		}, TRANSACTION.DURATION.ONE_DAY );

		var data = {
			transaction_id: transaction_id,
			metric: metric,
			user_vote: ( user_vote != null ? user_vote.value : "" ),
			score: ( score != null ? score : {} ),
		};

		var type_slug = metric.type.slug;

		if ( metric.type.has_submetrics === true ) {
			SUBMETRIC.findAll( {
				where: { rubric_id: metric.options['blueprint'] },
			} ).then( function( submetrics ) {
				data['submetrics'] = submetrics;
				render_metric( res, type_slug, data );
			} );
		} else {
			render_metric( res, type_slug, data );
		}
	})
} );

// TODO: Implement delete.

module.exports = router;
