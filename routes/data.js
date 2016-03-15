
const EXPRESS = require('express');
const PROMISE = require('sequelize').Promise;
const METRIC = require('../models/metric');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const AUTH = require('../includes/authentication');
const PASSPORT = require('passport');
const DEBUG = require('debug')('eval:data');

var router = EXPRESS.Router();

// TODO: Instead of login in on every request, we are supposed to provide a login url and just check req.user on each request.

/*router.use( function( req, res, next ) {
	if ( AUTH.is_authenticated() ) {
		next();
	} else {
		res.status(403).render('error', {
			message: "You are not authorized.",
			error: {},
		});
	}
} );*/

router.use( PASSPORT.authenticate( ['cas'], {
	// TODO: Define redirects
} ), function( req, res, next ) {
	DEBUG( "User Authenticated", req.session.passport.user );
	next();
} );

router.get('/', function(req, res, next) {
	METRIC.findAll().then( function( results ) {
		res.render( 'data/list', {
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
			res.send( "No metric #" + metric_id + " found." );
			return;
		}

		res.render( 'data/single', {
			title: "Data for " + metric.name,
			path: req.originalUrl,
			metric: metric,
			votes: votes,
			scores: ( scores != null ? scores : [] ),
		} );
	})
});

module.exports = router;
