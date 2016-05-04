
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

// Define some variables for this metric type.
module.exports = {
	title: "Poll",
	description: "Allows users to select one more text option, and assigns popularity to each option.",
	slug: "poll",
	valid_as_submetric: false,
	// These values are also implicit
	// has_submetrics: false,
};

/**
 * When a vote is received from the client, this function will be called to validate it.
 * @param new_values - The list of poll selections
 * @param metric - The metric which we validating for.
 * @return A valid vote, or null for "no vote"
 */
module.exports.validate_vote = function( new_values, metric ) {
	if ( new_values === '' || new_values == null ) {
		// If the new_values are empty, interpret that as "no vote"
		return null;
	} else if ( ! ( new_values instanceof Array ) ) {
		// If only a single value was given, put it into an array.
		new_values = [new_values]
	}

	// Get the number of possible poll options.
	answers_count = metric.options['answers'].match( /\r\n|\n|\r/g ).length;

	// For each choice in new_values, check that it is valid.
	for (var i = new_values.length - 1; i >= 0; i--) {
		if ( new_values[i] == null || new_values[i] < 0 || new_values[i] > answers_count ) {
			// If the value is null, or not in the range of valid poll options, remove it.
			delete new_values[i];
		} else {
			// If the value is valid, make sure that it is an integer, and not a string masquerading as an int.
			new_values[i] = parseInt( new_values[i] );
		}
	}

	if ( new_values.length <= 0 ) {
		// If there are no new_values in the end, interpret that as "no vote"
		return null;
	} else {
		// Otherwise return the result.
		return new_values;
	}
}

/**
 * When a user's vote changes we need to adjust the metric's cached score. This function handles that.
 * @param {array} score - The score map to adjust
 * @param {array|null} new_value - The new value of the user's vote.
 * @param {array|null} old_value - The old value of the user's vote.
 * @param {object} metric - The metric object that we are scoring for.
 */
module.exports.adjust_score = function( score, new_values, old_values, metric ) {
	// Pull out the tally of votes
	var votes = score.data;
	// Set a default for the total vote count.
	score.count = score.count || 0;

	// If the new and old vote differ, then adjust the total vote count.
	if ( new_values !== old_values ) {
		new_values_count = ( new_values ? new_values.length : 0 );
		old_values_count = ( old_values ? old_values.length : 0 );
		score.count += new_values_count - old_values_count;
	}

	// If the vote tally has not been initialized, then initialize it.
	if ( ! ( votes instanceof Array ) ) {
		// Get the number of poll options.
		answers_count = metric.options['answers'].match( /\r\n|\n|\r/g ).length + 1;
		// Initialize the vote tally array.
		votes = [];

		// Set each answer to have 0 votes to start with.
		for ( var i = 0; i < answers_count; i++ ) { 
			votes[ i ] = 0;
		}
	}

	// For each value in the old vote, reduce the tally for that poll option.
	if ( old_values instanceof Array ) {
		for (var i = old_values.length - 1; i >= 0; i--) {
			votes[ old_values[i] ]--;
		};
	}
	
	// For each value in the new vote, increase the tally for that poll option.
	if ( new_values instanceof Array ) {
		for (var i = new_values.length - 1; i >= 0; i--) {
			votes[ new_values[i] ]++;
		};
	}

	// Find the poll option with the most votes.
	var index = 0; // A variable to hold the poll option with the most votes.
	var max_value = votes[0]; // A variable to hold the number of votes for "index"

	for ( var i = 1; i < votes.length; i++ ) {
		if ( votes[i] > max_value ) {
			index = i;
			max_value = votes[i];
		}
	}

	// Set all the score variables to point to the most popular poll option.
	score.average = index;
	score.display = index;
	score.sorting = index;

	// Save the vote tally.
	score.data = votes;
}

/**
 * This function validates options save by the editor.
 * @param {array} options - The options to be validated.
 */
module.exports.validate_options = function( options ) {
	// Keep only the values which are expected for a "Poll" metric.
	return UTIL.keep( options, ['title', 'answers', 'multiselect'] );
}