
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

module.exports.slug = "poll";
module.exports.title = "Poll";

module.exports.validate_vote = function( new_value, old_value, metric ) {
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
	new_value = UTIL.validate_vote( new_value, old_value );
	var votes = score.data;

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