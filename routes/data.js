
const EXPRESS = require('express');
const PROMISE = require('sequelize').Promise;
const METRIC = require('../models/metric');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const UTIL = require('../includes/util');
const DEBUG = require('debug')('eval:data');

var router = EXPRESS.Router({ mergeParams: true });

router.get('/list/:api_key', function(req, res, next) {
	METRIC.findAll().then( function( results ) {
		res.status(200).json( results );
	} );
});

router.get('/metric/:api_key', function(req, res, next) {
	if ( UTIL.is_missing_attributes( ['metric_id'], req.params, res ) ) { return; }
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
		} else {
			res.status(200).json( {
				metric: metric,
				votes: votes,
				scores: ( scores != null ? scores : [] ),
			} );

		}

	})
});

module.exports = router;
