
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

module.exports = {
	title: "One Way",
	slug: "one-way",
};

module.exports.validate_vote = function( new_value, metric ) {
	new_value = parseInt( new_value );

	if ( new_value > 0 ) {
		return 1;
	} else {
		return null;
	}
}

module.exports.adjust_score = function( score, new_value, old_value, metric ) {
	score.count = score.count || 0;
	score.average = score.average || 0;
	
	if ( new_value !== old_value ) {
		if ( new_value === null ) {
			score.count--;
			DEBUG_VOTE("Decrement Count", score.count);
			new_value = 0;
		} else if ( old_value === null ) {
			score.count++;
			old_value = 0;
			DEBUG_VOTE("Increment Count", score.count);
		}
	}

	vote_diff = new_value - old_value;
	DEBUG_VOTE("Vote diff", new_value, "-", old_value, "=", vote_diff);

	score.average += vote_diff;
	DEBUG_VOTE("Setting Average", score.average);
	score.display = score.average;
	score.sorting = score.average;
}

module.exports.validate_options = function( options ) {
	return UTIL.keep( options, ['title', 'text', 'icon'] );
}
