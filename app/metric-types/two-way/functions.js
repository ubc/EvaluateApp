
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

// Define some variables for this metric type.
module.exports = {
	title: "Two Way",
	description: "A simple positive/negative metric. Users can vote either +1 or -1.",
	slug: "two-way",
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
		// Interpret any positive value as 1
		return 1;
	} else if ( new_value < 0 ) {
		// Interpret any negative value as -1
		return -1;
	} else {
		// Interpret anything else (such as 0 or NaN) as "no vote"
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
	// Get the number of positive votes.
	var positive_votes = typeof score.data === 'number' ? score.data : 0;
	// Set a default value for the total vote count.
	score.count = score.count || 0;
	// Set a default for the average score.
	score.average = score.average || 0;
	
	// Adjust the vote count.	
	if ( new_value !== old_value ) {
		if ( new_value === null ) {
			// If the new value is "no vote", then reduce the total vote count.
			score.count--;
			// Set the value of a "no vote", to 0.
			new_value = 0;
			// If necessary decrement the positive_votes
			if ( old_value > 0 ) positive_votes--;
		} else if ( old_value === null ) {
			// If the old value is "no vote", then reduce the total vote count.
			score.count++;
			// Set the value of a "no vote", to 0.
			old_value = 0;
			// If necessary increment the positive_votes
			if ( new_value > 0 ) positive_votes++;
		}
	}

	// Get the difference between the new and old votes.
	vote_diff = new_value - old_value;

	// Adjust the average
	score.average += vote_diff;
	score.display = score.average; // The score which will be displayed.

	// For sorting, we use a special function to better approximate the true average.
	// See here for an explanation: http://www.evanmiller.org/how-not-to-sort-by-average-rating.html
	score.sorting = calculate_wilson_score( positive_votes, score.count );

	// Save the number of positive votes.
	score.data = positive_votes;
}

/**
 * This function validates options save by the editor.
 * @param {array} options - The options to be validated.
 */
module.exports.validate_options = function( options ) {
	// Keep only the values which are expected for a "Two Way" metric.
	return UTIL.keep( options, ['title', 'text_up', 'text_down', 'icon'] );
}

/**
 * Taken from https://gist.github.com/mbadolato/8253004
 * calculates the wilson score: a lower bound on the "true" value of
 * the ratio of positive votes and total votes, given a confidence level
 *
 * See here for an explanation: http://www.evanmiller.org/how-not-to-sort-by-average-rating.html
 *
 * $z = 1.959964 = 95.0% confidence
 * $z = 2.241403 = 97.5% confidence
 */
function calculate_wilson_score( positive, count, z, base_votes ) {
	if ( typeof z === 'undefined' ) z = 1.959964;
	if ( typeof base_votes === 'undefined' ) base_votes = 10;

	// This means that every metric will be treated as if it has 10 (or user defined) votes to start with.
	// This is used to make unrated content appear higher than negatively rated content.
	// TODO: There may exist better solutions to this, such as using a negative wilson score.
	positive += base_votes / 2;
	count += base_votes;

	p = 1.0 * positive / count;
	numerator = p + z * z / (2 * count) - z * Math.sqrt((p * (1 - p) + z * z / (4 * count)) / count);
	denominator = 1 + z * z / count;
	return numerator / denominator;
}
