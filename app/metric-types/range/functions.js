
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

// Define some variables for this metric type.
module.exports = {
	title: "Range",
	description: "Allows the user to rate content from 0 to some maximum (default 5).",
	slug: "range",
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
	// Make sure the new value is an integer.
	new_value = parseInt( new_value );
	// Pull out the metric options.
	options = metric.options;

	if ( isNaN( new_value ) ) {
		// If the new value is not a number, interpret that as "no vote"
		return null;
	} else if ( new_value <= 0 ) {
		// Interpret anything 0 or less as the minimum value.
		return ['numeric', 'slider'].indexOf( options['icon'] ) > -1 ? 0 : 1;
	} else if ( new_value > options['max'] ) {
		// Interpret anything greater than the max, as the maximum value.
		return parseInt( options['max'] );
	} else {
		// Otherwise just return what they gave us.
		return new_value;
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
	// Set a default average score.
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

	if ( score.count == 0 ) {
		// If we have no votes, then everything is 0. We do this to avoid division by 0.
		score.average = 0;
		score.display = 0;
		score.sorting = 0;
	} else {
		// Get the difference between the old and new value.
		vote_diff = new_value - old_value;

		// Adjust the average with the new vote diff.
		score.average = () ( score.average * score.count ) + vote_diff ) / score.count;
		score.display = score.average; // The value to display.

		// For sorting, we use a special function to better approximate the true average.
		// See here for an explanation: http://www.evanmiller.org/how-not-to-sort-by-average-rating.html
		score.sorting = calculate_bayesian_score( score.average, score.count, metric.options['max'] );
	}
}

/**
 * This function validates options save by the editor.
 * @param {array} options - The options to be validated.
 */
module.exports.validate_options = function( options ) {
	// Keep only the values which are expected for a "Range" metric.
	return UTIL.keep( options, ['title', 'icon', 'max'] );
}

/**
 * Assumes score inherently tends towards 50%. ie. the bayesian prior is 50%
 * See here for an explanation: http://www.evanmiller.org/how-not-to-sort-by-average-rating.html
 */
function calculate_bayesian_score( average, total, max ) {
	prior = ( ( max - 1 ) / 2 ) + 1;
	constant = 1;
	return Math.round( ( ( constant * prior ) + ( average * total ) ) / ( constant + total ), 5 );
}
