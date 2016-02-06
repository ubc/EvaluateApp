
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('util');
const SUPER = require('./super');
const parent = SUPER.prototype;

function OneWayMetricType() {}

UTIL.inherits(OneWayMetricType, SUPER);

OneWayMetricType.prototype._validate_vote = function( new_vote, old_vote, options ) {
	// TODO: Convert buffer to integer.
	new_vote = parent._validate_vote(new_vote, old_vote, options);

	if ( new_vote > 0 ) {
		return 1;
	} else {
		return null;
	}
}

OneWayMetricType.prototype._adjust_score = function( score, new_vote, old_vote, metric ) {
	if ( new_vote !== old_vote ) {
		if ( new_vote === null ) {
			score['count']--;
			new_vote = 0;
		} else if ( old_vote === null ) {
			score['count']++;
			old_vote = 0;
		}
	}

	vote_diff = new_vote - old_vote;
	DEBUG_VOTE("Vote diff", new_vote, "-", old_vote, "=", vote_diff);

	score['average'] += vote_diff;
	score['display'] = score['average'];
	score['sorting'] = score['average'];

	return parent._adjust_score( score, new_vote, old_vote, metric );
}

OneWayMetricType.prototype.validate_options = function( options ) {
	return parent.validate_options( options, ['title', 'text', 'icon'] );
}

module.exports = new OneWayMetricType();