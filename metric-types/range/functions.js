
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

module.exports.slug = "range";

module.exports.validate_vote = function( new_value, old_value, metric ) {
	new_value = UTIL.validate_vote( new_value, old_value );
	options = metric.options;

	if ( new_value <= 0 ) {
		// Set the minimum value
		return ['numeric', 'slider'].indexOf( options['icon'] ) > -1 ? 1 : 0;
	} else if ( new_value > options['max'] ) {
		return parseInt( options['max'] );
	} else {
		return new_value;
	}
}

module.exports.adjust_score = function( score, new_value, old_value, metric ) {
	vote_diff = new_value - old_value;
	score.average = score.average * score.count;

	if ( new_value !== old_value ) {
		if ( new_value === null ) {
			score.count--;
		} else if ( old_value === null ) {
			score.count++;
		}
	}

	if ( score.count == 0 ) {
		score.average = 0;
		score.display = 0;
		score.sorting = 0;
	} else {
		score.average = ( score.average + vote_diff ) / score.count;
		score.display = score.average;
		score.sorting = calculate_bayesian_score( score.average, score.count, metric.options['max'] );
	}
}

module.exports.validate_options = function( options ) {
	return UTIL.keep( options, ['title', 'icon', 'max'] );
}

/**
 * Assumes score inherently tends towards 50%. ie. the bayesian prior is 50%
 */
function calculate_bayesian_score( average, total, max ) {
	prior = ( ( max - 1 ) / 2 ) + 1;
	constant = 1;
	return Math.round( ( ( constant * prior ) + ( average * total ) ) / ( constant + total ), 5 );
}
