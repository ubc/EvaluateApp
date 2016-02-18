
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

module.exports = {
	title: "Two Way",
	slug: "two-way",
};

module.exports.validate_vote = function( new_value, old_value, metric ) {
	new_value = UTIL.validate_vote( new_value, old_value );

	if ( new_value > 0 ) {
		return 1;
	} else if ( new_value < 0 ) {
		return -1;
	} else {
		return null;
	}
}

module.exports.adjust_score = function( score, new_value, old_value, metric ) {
	var positive_votes = typeof score.data === 'number' ? score.data : 0;
	DEBUG_VOTE("positive_votes", positive_votes);
	score.count = score.count || 0;
	score.average = score.average || 0;
	
	if ( new_value !== old_value ) {
		if ( new_value === null ) {
			score.count--;
			new_value = 0;
			if ( old_value > 0 ) positive_votes--;
		} else if ( old_value === null ) {
			score.count++;
			old_value = 0;
			if ( new_value > 0 ) positive_votes++;
		}
	}

	vote_diff = new_value - old_value;
	score.average += vote_diff;
	score.display = score.average;
	score.data = positive_votes;

	score.sorting = calculate_wilson_score( positive_votes, score.count );
}

module.exports.validate_options = function( options ) {
	return UTIL.keep( options, ['title', 'text_up', 'text_down', 'icon'] );
}

/**
 * Taken from https://gist.github.com/mbadolato/8253004
 * calculates the wilson score: a lower bound on the "true" value of
 * the ratio of positive votes and total votes, given a confidence level
 *
 * $z = 1.959964 = 95.0% confidence
 * $z = 2.241403 = 97.5% confidence
 */
function calculate_wilson_score( positive, count, z, base_votes ) {
	if ( typeof z === 'undefined' ) z = 1.959964;
	if ( typeof base_votes === 'undefined' ) base_votes = 10;
	DEBUG_VOTE("Wilson score vars", positive, count, z, base_votes);

	// This means that every metric will be treated as if it has 10 (or user defined) votes to start with.
	// This is used to make unrated content appear higher than negatively rated content.
	// TODO: There may exist better solutions to this, such as using a negative wilson score.
	positive += base_votes / 2;
	count += base_votes;

	p = 1.0 * positive / count;
	numerator = p + z * z / (2 * count) - z * Math.sqrt((p * (1 - p) + z * z / (4 * count)) / count);
	denominator = 1 + z * z / count;
	DEBUG_VOTE("Wilson score", numerator, "/", denominator, "=", numerator / denominator);
	return numerator / denominator;
}
