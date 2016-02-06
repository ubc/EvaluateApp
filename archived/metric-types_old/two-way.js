
const UTIL = require('util');
const SUPER = require('./super');
const parent = SUPER.prototype;

function TwoWayMetricType() {}

UTIL.inherits(TwoWayMetricType, SUPER);

TwoWayMetricType.prototype._validate_vote = function( new_vote, old_vote, options ) {
	new_vote = parent.validate_vote( new_vote, old_vote, options );

	if ( new_vote > 0 ) {
		return 1;
	} else if ( new_vote < 0 ) {
		return -1;
	} else {
		return null;
	}
}

TwoWayMetricType.prototype._adjust_score = function( score, new_vote, old_vote, metric ) {
	vote_diff = new_vote - old_vote;

	if ( new_vote !== old_vote ) {
		if ( new_vote === null ) {
			score['count']--;
			if ( old_vote > 0 ) score['data']['positive_votes']--;
		} else if ( old_vote === null ) {
			score['count']++;
			if ( new_vote > 0 ) score['data']['positive_votes']++;
		}
	}

	score['average'] += vote_diff;
	score['display'] = score['average'];
	score['sorting'] = calculate_wilson_score( score['data']['positive_votes'], score['count'] );

	return parent._adjust_score( score, new_vote, old_vote, metric );
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

	// This means that every metric will be treated as if it has 10 (or user defined) votes to start with.
	// This is used to make unrated content appear higher than negatively rated content.
	// TODO: There may exist better solutions to this, such as using a negative wilson score.
	positive += base_votes / 2;
	count += base_votes;

	p = 1.0 * positive / count;
	numerator = p + z * z / (2 * count) - z * sqrt((p * (1 - p) + z * z / (4 * count)) / count);
	denominator = 1 + z * z / count;
	return numerator / denominator;
}

OneWayMetricType.prototype.validate_options = function( options ) {
	return parent.validate_options( options, ['title', 'icon', 'text_up', 'text_down'] );
}

module.exports = new TwoWayMetricType();
