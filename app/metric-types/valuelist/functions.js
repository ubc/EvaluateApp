
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

module.exports = {
	title: "Value List",
	description: "A list of options from which the user can select one or more. Each option has a value associated with it, and these values are summed to determine the final score.",
	slug: "valuelist",
	valid_as_submetric: true,
	// These values are also implicit
	// has_submetrics: false,
};

/**
 * When a vote is received from the client, this function will be called to validate it.
 * @param new_value - The unvalidated vote
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

	// Get the number of possible list options.
	choices = parse_choices( metric.options['choices'] );

	// For each choice in new_values, check that it is valid.
	for (var i = new_values.length - 1; i >= 0; i--) {
		if ( new_values[i] == null || ! (new_values[i] in choices) ) {
			// If the value is null, or not in the range of valid poll options, remove it.
			delete new_values[i];
		} else {
			// If the value is valid, make sure that it is an integer, and not a string masquerading as an int.
			new_values[i] = parseInt( new_values[i] );
		}
	}

	if ( new_values.length > 0 ) {
		return new_values;
	} else {
		// If there are no new_values in the end, interpret that as "no vote"
		return null;
	}
}

/**s
 * When a user's vote changes we need to adjust the metric's cached score. This function handles that.
 * @param {array} score - The score map to adjust
 * @param {array|null} new_value - The new value of the user's vote.
 * @param {array|null} old_value - The old value of the user's vote.
 * @param {object} metric - The metric object that we are scoring for.
 */
module.exports.adjust_score = function( score, new_values, old_values, metric ) {
	// Set a default value for the total vote count.
	score.count = score.count || 0;
	// Set a default average score.
	score.average = score.average || 0;

	// Adjust the total vote count.
	if ( new_values !== old_values ) {
		if ( new_values === null ) {
			// If the new value is "no vote", then reduce the total vote count.
			score.count--;
			new_values = {};
		} else if ( old_values === null ) {
			// If the old value is "no vote", then increase the total vote count.
			score.count++;
			old_values = {};
		}
	}

	if ( score.count == 0 ) {
		// If we have no votes, then set everything to 0. We do this to avoid division by 0.
		score.average = 0;
		score.display = 0;
		score.sorting = 0;
	} else {
		// Parse out the list of choices, with their values.
		choices = parse_choices( metric.options['choices'] );
		// Calculate the difference between the old and new values.
		vote_diff = calculate_score( new_values, choices ) - calculate_score( old_values, choices );

		// Adjust the average using the new vote difference.
		score.average = ( ( score.average * score.count ) + vote_diff ) / score.count;
		score.display = score.average; // The value to display
		score.sorting = score.average; // TODO: Consider a better sorting method.
	}
}

/**
 * This function validates options save by the editor.
 * @param {array} options - The options to be validated.
 */
module.exports.validate_options = function( options ) {
	// Keep only the values which are expected for a "Poll" metric.
	return UTIL.keep( options, ['title', 'choices', 'multiselect'] );
}

/**
 * Parses a text block into Valuelist choices.
 * @param {string} raw_choices - Expects a string where each line has the format "0|Option" aka "value|text"
 * @return {array} A map of values to text.
 */
function parse_choices( raw_choices ) {
	raw_choices = raw_choices.split( /\r?\n/ );

	choices = {}
	for ( var i = raw_choices.length - 1; i >= 0; i-- ) {
		var split = raw_choices[i].split("|", 2);
		choices[i] = split[0];
	}

	return choices;
}

/**
 * Given a list of values, and a list of choices. Sum up the values for those choices.
 * @param {array} values
 * @param {array} choices
 * @return {int}
 */
function calculate_score( values, choices ) {
	result = 0;

	if ( values != null ) {
		for (var i = values.length - 1; i >= 0; i--) {
			var index = values[i];
			result += parseFloat( choices[index] );
		}
	}

	return result;
}
