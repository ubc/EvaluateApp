
const PROMISE = require("sequelize").Promise;
const EXPRESS = require('express');
const METRIC = require('../models/metric');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const SUBMETRIC = require('../models/submetric')
const DEBUG = require('debug')('eval:api');
const DEBUG_VOTE = require('debug')('eval:voting');
const TRANSACTION = require('../includes/transaction');
const PASSPORT = require('passport');

var router = EXPRESS.Router();

router.post('/saml',
	PASSPORT.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
	function(req, res, next) {
		DEBUG("Got /api/saml hit");
		res.redirect('/');
	}
);

// TODO: Use appropriate HTTP status codes on all responses.
// TODO: Change vote nullification to be on the front end only.
router.post('/vote', function( req, res, next ) {
	DEBUG_VOTE('API CALL', "vote", req.body);

	var data = TRANSACTION.redeem( req.body.transaction_id, "vote" );
	DEBUG_VOTE('Got transaction data', data);
	var new_value = req.body.vote;

	if ( data == false ) {
		// This means that the transaction authorization failed.
		res.json( "Nonce check failed. Your session may have expired, try refreshing the page." ); // Return a failure.
		return;
	}

	METRIC.findById( data.metric_id ).then( function( metric ) {
		var promises = [];

		promises.push( VOTE.findOne( {
			attributes: ['id', 'value'],
			where: { 
				metric_id: data.metric_id,
				context_id: data.context_id,
				user_id: data.user_id,
			},
		} ) );

		promises.push( SCORE.findOrInitialize( {
			where: { 
				metric_id: data.metric_id,
				context_id: data.context_id,
			},
		} ) );

		if ( metric.type.has_submetrics === true ) {
			promises.push( SUBMETRIC.findAll( {
				where: { rubric_id: metric.options.blueprint },
			} ) );
		}

		PROMISE.all(promises).spread( function( vote, score_result, submetrics ) {
			DEBUG_VOTE( "Setting vote", "to", new_value == null ? "null" : new_value, "for", metric.metric_id, "with", submetrics != null ? submetrics.length : 0, "submetrics." );

			var score = score_result[0];
			var old_value = ( vote == null ? null : vote.value );

			new_value = metric.type.validate_vote( new_value, old_value, metric, submetrics );

			if ( new_value != old_value ) {
				metric.type.adjust_score( score, new_value, old_value, metric, submetrics );

				if ( old_value == null ) {
					VOTE.create( {
						metric_id: data.metric_id,
						context_id: data.context_id,
						user_id: data.user_id,
						value: new_value,
					} );
				} else if ( new_value == null ) {
					vote.destroy();
				} else {
					vote.value = new_value;
					vote.save();
				}

				score.save();
			}

			res.json( {
				score: score.display,
				score_data: score.data,
				vote: new_value,
				total: score.count,
			} );
		} );
	} );
} );

router.get('/auth/:api_key', function( req, res, next ) {
	// TODO: Remove this test header.
	res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

	if ( !req.params.api_key /* TODO: Actually check api key validity */ ) {
		res.status(403).send("Not Authorized");
	} else if ( ! ( req.query.metric_id && req.query.context_id && req.query.user_id ) ) {
		res.status(404).send("Metric, User, or Context is not specified");
	} else {
		var transaction_id = TRANSACTION.create( {
			action: TRANSACTION.TYPE.VOTE,
			data: {
				metric_id: req.query.metric_id,
				context_id: req.query.context_id,
				user_id: req.query.user_id,
			},
			duration: TRANSACTION.DURATION.ONE_DAY,
			limit: 5,
		} );

		res.send(transaction_id);
	}
} );

router.get( '/preview/:metric_id/', function( req, res ) {
	var promises = [];

	promises.push( METRIC.findById( req.params.metric_id ) );

	promises.push( SCORE.findOne( { // TODO: findOneOrCreate
		attributes: ['count', 'display', 'data'],
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
				res.render( "metrics/single", data );
			} );
		} else {
			res.render( "metrics/single", data );
		}
	})
} );

router.get( '/embed/:transaction_id', function( req, res ) {
	var transaction = TRANSACTION.data( req.params.transaction_id );
	if ( transaction == false ) {
		res.status(503).send("Not Authorized");
		return;
	}

	var promises = [];

	promises.push( METRIC.findById( transaction.metric_id ) );

	promises.push( VOTE.findOne( {
		attributes: ['value'],
		where: { 
			metric_id: transaction.metric_id,
			context_id: transaction.context_id,
			user_id: transaction.user_id,
		},
	} ) );

	promises.push( SCORE.findOne( { // TODO: findOneOrCreate
		attributes: ['count', 'display', 'data'],
		where: { 
			metric_id: transaction.metric_id,
			context_id: transaction.context_id,
		},
	} ) );

	PROMISE.all( promises ).spread( function( metric, user_vote, score ) {
		if ( metric == null ) {
			res.status(404).send( "No metric #" + transaction.metric_id + " found." );
			return;
		}

		var data = {
			transaction_id: req.params.transaction_id,
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
				res.render( "metrics/single", data );
			} );
		} else {
			res.render( "metrics/single", data );
		}
	})
} );

module.exports = router;
