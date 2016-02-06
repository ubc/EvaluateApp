
const UTIL = require('util');
const SUPER = require('./super');
const parent = SUPER.prototype;

function RangeMetricType() {}

UTIL.inherits(RangeMetricType, SUPER);

RangeMetricType.prototype._validate_vote = function( new_vote, old_vote, options ) {
	new_vote = parent.validate_vote( new_vote, old_vote, options );

	if ( new_vote <= 0 ) {
		// Set the minimum value
		return ['numeric', 'slider'].indexOf( options['icon'] ) > -1 ? 1 : 0;
	} else if ( new_vote > options['max'] ) {
		return parseInt( options['max'] );
	} else {
		return new_vote;
	}
}

RangeMetricType.prototype._adjust_score = function( score, new_vote, old_vote, metric ) {
	vote_diff = new_vote - old_vote;
	score['average'] = score['average'] * score['count'];

	if ( new_vote !== old_vote ) {
		if ( new_vote === null ) {
			score['count']--;
		} else if ( old_vote === null ) {
			score['count']++;
		}
	}

	if ( score['count'] == 0 ) {
		score['average'] = 0;
		score['display'] = 0;
		score['sorting'] = 0;
	} else {
		score['average'] = ( score['average'] + vote_diff ) / score['count'];
		score['display'] = score['average'];
		score['sorting'] = calculate_bayesian_score( score['average'], score['count'], metric['options']['max'] );
	}

	return parent._adjust_score( score, new_vote, old_vote, metric );
}

/**
 * Assumes score inherently tends towards 50%. ie. the bayesian prior is 50%
 */
function calculate_bayesian_score( average, total, max ) {
	prior = ( ( max - 1 ) / 2 ) + 1;
	constant = 1;
	return round( ( ( constant * prior ) + ( average * total ) ) / ( constant + total ), 5 );
}

RangeMetricType.prototype.validate_options = function( options ) {
	return parent.validate_options( options, ['title', 'icon', 'max'] );
}

module.exports = new TwoWayMetricType();
