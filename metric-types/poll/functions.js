
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

module.exports = {
	title: "Poll",
	slug: "poll",
	valid_as_submetric: false,
};

// TODO: allow users to define meaningful values to each poll option - or exclude polls from Rubrics.
// TODO: Make polls update properly.

module.exports.validate_vote = function( new_value, old_value, metric ) {
	DEBUG_VOTE("Validating poll vote", new_value, old_value, metric.options)
	if ( new_value === '' ) {
		return null;
	}

	answers_count = metric.options['answers'].match( /\r\n|\n|\r/g ).length;
	new_value = UTIL.validate_vote( new_value, old_value );

	if ( new_value < 0 || new_value > answers_count ) {
		return null;
	} else {
		return new_value;
	}
}

module.exports.adjust_score = function( score, new_value, old_value, metric ) {
	var votes = score.data;
	score.count = score.count || 0;

	if ( new_value !== old_value ) {
		if ( new_value === null ) {
			score.count--;
		} else if ( old_value === null ) {
			score.count++;
		}
	}

	// Initialize the data array
	if ( ! ( votes instanceof Array ) ) {
		answers_count = metric.options['answers'].match( /\r\n|\n|\r/g ).length + 1;
		votes = [];

		for ( var i = 0; i < answers_count; i++ ) { 
			votes[ i ] = 0;
		}
	}

	// Tally votes
	if ( old_value !== null ) {
		votes[ old_value ]--;
	} 

	if ( new_value !== null ) {
		votes[ new_value ]++;
	}

	// Find the highest value
	var max_value = votes[0];
	var index = 0;

	for ( var i = 1; i < votes.length; i++ ) {
		if ( votes[i] > max_value ) {
			index = i;
			max_value = votes[i];
		}
	}

	score.average = index;
	score.display = index;
	score.sorting = index;
	score.data = votes;
}

module.exports.validate_options = function( options ) {
	return UTIL.keep( options, ['title', 'answers'] );
}