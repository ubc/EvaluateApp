
const JADE = require('jade')
const PROMISE = require('sequelize').Promise;
const EXPRESS = require('express');
const METRIC = require('../models/metric');
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

router.get('/', function( req, res, next ) {
	METRIC.findAll().then( function( results ) {
		res.render( 'metrics/list', {
			title: "Metrics List",
			path: req.originalUrl,
			metrics: results,
		} );
	} );
});

router.get('/create', function( req, res, next ) {
	res.render( 'metrics/editor', {
		title: "Create",
			path: req.originalUrl,
		metric: { options: {} },
	 });
});

router.get('/edit/:id', function( req, res, next ) {
	METRIC.findOne( {
		where: { metric_id: req.params.id },
	} ).then( function( metric ) {
		if ( metric == null ) {
			res.send( "No metric #" + req.params.id + " found." );
			return;
		}

		res.render('metrics/editor', {
			title: "Edit Metric",
			path: req.originalUrl,
			metric_id: metric.metric_id,
			metric: metric,
		});
	} );
});

function save_metric( req, res, next ) {
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

router.post( '/edit/:id', save_metric );
router.post( '/create', save_metric );


router.get('/embed/:id/', function( req, res, next ) {
	var promises = [];

	promises.push( METRIC.findById( req.params.id ) );

	promises.push( SCORE.findOne( { // TODO: findOneOrCreate
		attributes: ['display'],
		where: { 
			metric_id: req.params.id,
			context_id: "context",
		},
	} ) );

	PROMISE.all( promises ).spread( function( metric, score ) {
		if ( metric == null ) {
			res.status(404).send( "No metric #" + req.params.id + " found." );
			return;
		}

		var data = {
			metric: metric,
			score: ( score != null ? score : {} ),
		};

		data['body'] = JADE.renderFile( __dirname + "/../metric-types/" + metric.type.slug + "/display.jade", data );
		res.render( "metrics/single", data );
	})
});

router.get('/embed/:id/:user_id', function( req, res, next ) {
	var promises = [];

	promises.push( METRIC.findById( req.params.id ) );

	promises.push( VOTE.findOne( {
		attributes: ['value'],
		where: { 
			metric_id: req.params.id,
			context_id: "context",
			user_id: req.params.user_id,
		},
	} ) );

	promises.push( SCORE.findOne( { // TODO: findOneOrCreate
		attributes: ['display'],
		where: { 
			metric_id: req.params.id,
			context_id: "context",
		},
	} ) );

	PROMISE.all( promises ).spread( function( metric, user_vote, score ) {
		if ( metric == null ) {
			res.status(404).send( "No metric #" + req.params.id + " found." );
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

		data['body'] = JADE.renderFile( __dirname + "/../metric-types/" + metric.type.slug + "/display.jade", data );
		res.render( "metrics/single", data );
	})
});

module.exports = router;
