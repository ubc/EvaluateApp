
/**
 * This module handles requests to all the `/data/*` paths.
 * For detailed information on these paths, see `documentation/Developer.md`
 */

const EXPRESS = require('express');
const PROMISE = require('sequelize').Promise;
const METRIC = require('../models/metric');
const VOTE = require('../models/vote');
const SCORE = require('../models/score');
const UTIL = require('../includes/util');

var router = EXPRESS.Router();

/**
 * This requests and returns raw voting data from the server.
 * @param {string} api_key - The API key which data will be restricted to.
 * @param {array} args - This can contain a metric_id or context_id to restrict the data to.
 * @param {function} callback - A function to handle the results.
 */
function get_metric_data( api_key, args, callback ) {
	// Options for the database request.
	var options = {
		attributes: [ 'metric_id', 'name', 'type', 'options' ],
		where: {
			api_key: api_key,
		},
	};

	// Parameters for the vote request
	var vote = {
		model: VOTE,
		attributes: [ 'value', 'context_id', 'user_id', 'modified' ],
	};

	// Parameters for the score request.
	var score = {
		model: SCORE,
		attributes: [ 'data', 'context_id', 'count', 'sorting', 'display', 'average', 'modified' ],
	};

	// If the metric_id is provided, restrict data to that.
	if ( args.metric_id ) {
		options.where.metric_id = args.metric_id;
	}

	// If the context_id is provided, restrict vote and score data to that context.
	if ( args.context_id ) {
		vote.where = { context_id: args.context_id };
		score.where = { context_id: args.context_id };
	}

	// We want to just include the votes and scores which are attached to the Metrics we are querying for.
	options.include = [ vote, score ];

	// Make the database request, and pass the results to the callback.
	METRIC.findAll( options ).then( callback );
}

// Get raw voting data from the server.
router.get('/:api_key', function( req, res, next ) {
	get_metric_data( req.params.api_key, req.body, function( results ) {
		res.status(200).json( results );
	} );
});

module.exports = router;
