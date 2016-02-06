
const UTIL = require('util');
const SUPER = require('./super');
const parent = SUPER.prototype;

function PollMetricType() {}

UTIL.inherits(PollMetricType, SUPER);

PollMetricType.prototype._validate_vote = function( new_vote, old_vote, options ) {
	if ( new_vote === '' ) {
		return null;
	}

	answers_count = options['answers'].match( /\r\n|\n|\r/g ).length;
	new_vote = parent.validate_vote( new_vote, old_vote, options );

	if ( new_vote < 0 || new_vote > answers_count ) {
		return null;
	} else {
		return new_vote;
	}
}

PollMetricType.prototype._adjust_score = function( score, new_vote, old_vote, metric ) {
	var votes = score['data']['votes'];

	// Initialize the data array
	if ( typeof votes != Array ) {
		answers_count = metric['options']['answers'].match( "/\r\n|\n|\r/" ).length;
		votes = [];

		for ( var i = 0; i < answers_count; i++ ) { 
			votes[ i ] = 0;
		}
	}

	// Tally votes
	if ( old_vote !== null ) {
		votes[ old_vote ]--;
	} 

	if ( new_vote !== null ) {
		votes[ new_vote ]++;
	}

	// Find the highest value
	var max_value = votes[0];
	var index = 0;

	for ( var i = 1; i < votes.length; i++ ) {
		if ( votes[i] > max_value ) {
			index = i;
			max_value = votes[i];
		}
	}

	score['average'] = index;
	score['display'] = index;
	score['sorting'] = index;
	score['data']['votes'] = votes;

	return parent._adjust_score( score, new_vote, old_vote, metric );
}

PollMetricType.prototype.validate_options = function( options ) {
	return parent.validate_options( options, ['title', 'answers'] );
}

module.exports = new TwoWayMetricType();
