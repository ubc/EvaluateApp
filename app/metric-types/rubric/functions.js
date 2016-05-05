
/**
 * The Rubric metric type is an unusual metric type, in that is has submetrics.
 * A lot of the way things are done here is not typical.
 */

const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

// Define some variables for this metric type.
module.exports = {
	title: "Rubric",
	description: "This defines a metric composed of other metrics, and averages their scores. Each submetric can be individually weighted.",
	slug: "rubric",
	valid_as_submetric: false,
	has_submetrics: true,
};

/**
 * When a vote is received from the client, this function will be called to validate it.
 * @param new_value - The unvalidated vote
 * @param metric - The metric which we validating for.
 * @param submetrics - The submetrics for this Rubric.
 * @return A valid vote, or null for "no vote"
 */
module.exports.validate_vote = function( new_value, metric, submetrics ) {
	// For a Rubric we expect a json of votes on it's submetrics.
	try {
		// Try to parse the json.
		new_value = JSON.parse( new_value );
	} catch (err) {
		DEBUG_VOTE("Error parsing JSON for Rubric", err.message);
		// If the json is not valid interpret that as "no vote"
		new_value = null
	}

	if ( typeof new_value === 'object' ) {
		// Loop through the json, and validate each value using the submetric's validator.
		for ( var i in new_value ) {
			var submetric = UTIL.select_from( submetrics, { id: i } );
			new_value[i] = submetric.type.validate_vote( new_value[i], submetric );
		}
	} else {
		// If the result is not an object, interpret that as "no vote"
		new_value = null;
	}

	return new_value;
}

/**
 * When a user's vote changes we need to adjust the metric's cached score. This function handles that.
 * @param {array} score - The score map to adjust
 * @param {array|null} new_value - The new value of the user's vote.
 * @param {array|null} old_value - The old value of the user's vote.
 * @param {object} metric - The metric object that we are scoring for.
 * @param {array} submetrics - A list of submetrics for this Rubric.
 */
module.exports.adjust_score = function( score, new_value, old_value, metric, submetrics ) {
	// Set a default value for the number of votes.
	score.count = score.count || 0;
	// Reset the average as we will be recalculating it.
	score.average = 0;

	// Get the scoring data for the submetrics.
	var submetric_data = score.data || {};

	// Adjust the vote count.	
	if ( new_value !== old_value ) {
		if ( new_value === null ) {
			score.count--;
		} else if ( old_value === null ) {
			score.count++;
		}
	}

	// Set a default value for the old vote.
	old_value = old_value || {}

	// Loop through each submetric and run "adjust_score" for each one using their metric type.
	for ( var i in submetrics ) {
		// Get the submetric variables.
		var submetric = submetrics[i];
		var submetric_id = submetric.id;
		var submetric_score = submetric_data[submetric_id] || {};
		var submetric_new_value = submetric_id in new_value ? new_value[submetric_id] : null;
		var submetric_old_value = submetric_id in old_value ? old_value[submetric_id] : null;

		// Call adjust score.
		submetric.type.adjust_score( submetric_score, submetric_new_value, submetric_old_value, submetric );

		// Save the submetric's new score.
		submetric_data[submetric_id] = submetric_score;

		// Add the submetric's score to the average, adjusted by the submetric's weight.
		score.average += submetric_score.average * submetric.weight;
	}

	// Divide by the number of submetrics to get an average value.
	score.average /= submetrics.length;
	score.sorting = score.average; // The score which is displayed.
	score.display = score.average; // The score which is used for sorting.

	// Save the submetric scoring data.
	score.data = submetric_data;
}

/**
 * This function validates options save by the editor.
 * @param {array} options - The options to be validated.
 */
module.exports.validate_options = function( options ) {
	// Keep only the values which are expected for a "Rubric" metric.
	return UTIL.keep( options, ['title', 'blueprint'] );
}
