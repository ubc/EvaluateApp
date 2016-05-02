
const EXPRESS = require('express');
const PROMISE = require('sequelize').Promise;
const METRIC = require('../models/metric');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const UTIL = require('../includes/util');
const DEBUG = require('debug')('eval:data');

var router = EXPRESS.Router({ mergeParams: true });

function get_metric_data( api_key, args, callback ) {
	var options = {
		attributes: [ 'metric_id', 'name', 'type', 'options' ],
		where: {
			api_key: api_key,
		},
	};

	var vote = {
		model: VOTE,
		attributes: [ 'value', 'context_id', 'user_id', 'modified' ],
	};

	var score = {
		model: SCORE,
		attributes: [ 'data', 'context_id', 'count', 'sorting', 'display', 'average', 'modified' ],
	};

	if ( args.metric_id ) {
		options.where.metric_id = args.metric_id;
	}

	if ( args.context_id ) {
		vote.where = { context_id: args.context_id };
		score.where = { context_id: args.context_id };
	}

	options.include = [ vote, score ];

	METRIC.findAll( options ).then( callback );
}

router.get('/:api_key', function( req, res, next ) {
	get_metric_data( req.params.api_key, req.body, function( results ) {
		res.status(200).json( results );
	} );
});

module.exports = router;
