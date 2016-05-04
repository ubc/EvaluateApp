
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

// Define some variables for this metric type.
module.exports = {
	title: "One Way",
	description: "A simple thumbs-up style metric. You can vote +1 or nothing",
	slug: "one-way",
	// These values are also implicit
	// valid_as_submetric: true,
	// has_submetrics: false,
};

/**
 * When a vote is received from the client, this function will be called to validate it.
 * @param new_value - The unvalidated vote
 * @param metric - The metric which we validating for.
 * @return A valid vote, or null for "no vote"
 */
module.exports.validate_vote = function( new_value, metric ) {
	// Votes from the client are often a string, parse it into an int.
	new_value = parseInt( new_value );

	if ( new_value > 0 ) {
		// Interpret any positive value as 1.
		return 1;
	} else {
		// Interpret any negative value as "no vote".
		return null;
	}
}

/**
 * When a user's vote changes we need to adjust the metric's cached score. This function handles that.
 * @param {array} score - The score map to adjust
 * @param {int|null} new_value - The new value of the user's vote.
 * @param {int|null} old_value - The old value of the user's vote.
 * @param {object} metric - The metric object that we are scoring for.
 */
module.exports.adjust_score = function( score, new_value, old_value, metric ) {
	// Set a default vote count.
	score.count = score.count || 0;
	// Set a default average vote.
	score.average = score.average || 0;

	// Adjust the vote count.	
	if ( new_value !== old_value ) {
		if ( new_value === null ) {
			// If the new value is "no vote", then reduce the total vote count.
			score.count--;
			// Set the value of a "no vote", to 0.
			new_value = 0;
		} else if ( old_value === null ) {
			// If the old value was "no vote", then increase the total vote count.
			score.count++;
			// Set the value of a "no vote", to 0.
			old_value = 0;
		}
	}

	// Get the difference in value between the new and old votes.
	vote_diff = new_value - old_value;

	// Adjust the average using this new value.
	score.average += vote_diff;
	score.display = score.average; // The score which is displayed.
	score.sorting = score.average; // The score which is used for sorting.
}

/**
 * This function validates options save by the editor.
 * @param {array} options - The options to be validated.
 */
module.exports.validate_options = function( options ) {
	// Keep only the values which are expected for a "One Way" metric.
	return UTIL.keep( options, ['title', 'text', 'icon'] );
}
