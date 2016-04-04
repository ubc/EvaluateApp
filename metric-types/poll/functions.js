
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

// TODO: Allow the user to select multiple answers, if that option is enabled (and create that option)
module.exports = {
	title: "Poll",
	slug: "poll",
	valid_as_submetric: false,
};

module.exports.validate_vote = function( new_values, old_values, metric ) {
	DEBUG_VOTE("Validating poll vote", new_values, old_values, metric.options)
	if ( new_values === '' ) {
		return null;
	} else if ( ! ( new_values instanceof Array ) ) {
		new_values = [new_values]
	}

	answers_count = metric.options['answers'].match( /\r\n|\n|\r/g ).length;

	for (var i = new_values.length - 1; i >= 0; i--) {
		if ( new_values[i] == null || new_values[i] < 0 || new_values[i] > answers_count ) {
			delete new_values[i];
		} else {
			// TODO: Make all validate_vote functions take a stance on string vs number.
			new_values[i] = parseInt( new_values[i] );
		}
	}

	if ( new_values.length <= 0 ) {
		DEBUG_VOTE("Validated poll vote", null);
		return null;
	} else {
		DEBUG_VOTE("Validated poll vote", new_values);
		return new_values;
	}
}

module.exports.adjust_score = function( score, new_values, old_values, metric ) {
	var votes = score.data;
	score.count = score.count || 0;

	if ( new_values !== old_values ) {
		new_values_count = ( new_values ? new_values.length : 0 );
		old_values_count = ( old_values ? old_values.length : 0 );
		score.count += new_values_count - old_values_count;
		DEBUG_VOTE("Adjust vote count", new_values_count - old_values_count);
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
	if ( old_values instanceof Array ) {
		for (var i = old_values.length - 1; i >= 0; i--) {
			votes[ old_values[i] ]--;
		};
	}
	
	if ( new_values instanceof Array ) {
		for (var i = new_values.length - 1; i >= 0; i--) {
			votes[ new_values[i] ]++;
		};
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
	return UTIL.keep( options, ['title', 'answers', 'multiselect'] );
}