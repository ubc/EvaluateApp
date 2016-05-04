
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
			new_value = 0;
		} else if ( old_value === null ) {
			score.count++;
			old_value = 0;
		}
	}

	vote_diff = new_value - old_value;

	score.average += vote_diff;
	score.display = score.average;
	score.sorting = score.average;
}

module.exports.validate_options = function( options ) {
	return UTIL.keep( options, ['title', 'text', 'icon'] );
}
