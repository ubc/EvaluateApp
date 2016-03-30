
const EXPRESS = require('express');
const PROMISE = require('sequelize').Promise;
const METRIC = require('../models/metric');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const AUTH = require('../includes/authentication');
const PASSPORT = require('passport');
const DEBUG = require('debug')('eval:data');

var router = EXPRESS.Router();

router.use( AUTH.require_login );

router.get('/', function(req, res, next) {
	METRIC.findAll().then( function( results ) {
		res.status(200).render( 'data/list', {
			title: 'Data',
			path: req.originalUrl,
			metrics: results,
		} );
	} );
});

router.get('/:metric_id', function(req, res, next) {
	var metric_id = req.params.metric_id;
	var promises = [];

	promises.push( METRIC.findById( metric_id ) );

	promises.push( VOTE.findAll( {
		where: { metric_id: metric_id },
	} ) );

	promises.push( SCORE.findAll( {
		where: { metric_id: metric_id },
	} ) );

	PROMISE.all( promises ).spread( function( metric, votes, scores ) {
		if ( metric == null ) {
			res.status(404).send( "No metric #" + metric_id + " found." );
			return;
		}

		res.status(200).render( 'data/single', {
			title: "Data for " + metric.name,
			path: req.originalUrl,
			metric: metric,
			votes: votes,
			scores: ( scores != null ? scores : [] ),
		} );
	})
});

module.exports = router;
