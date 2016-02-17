
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

module.exports.slug = "rubric";
module.exports.title = "Rubric";

module.exports.validate_vote = function( new_value, old_value, metric, submetrics ) {
	new_value = JSON.parse( new_value );

	if ( typeof new_value === 'object' ) {
		// Validate vote for each submetric.
		for ( var i in new_value ) {
			var submetric = UTIL.select_from( submetrics, { id: i } );
			// Don't supply an old value, because we don't want to allow vote cancelling.
			new_value[i] = submetric.type.validate_vote( new_value[i], null, submetric );
		}
	} else {
		new_value = null;
	}

	return new_value;
}

module.exports.adjust_score = function( score, new_value, old_value, metric, submetrics ) {
	old_value = old_value || {}

	var submetric_data = score.data || {};
	score.count = score.count || 0;
	score.average = 0;

	if ( new_value !== old_value ) {
		if ( new_value === null ) {
			score.count--;
		} else if ( old_value === null ) {
			score.count++;
		}
	}

	// Adjust the score for each submetric.
	for ( var i in submetrics ) {
		var submetric = submetrics[i];
		var submetric_id = submetric.id;
		var submetric_score = submetric_data[submetric_id] || {};
		var submetric_new_value = typeof new_value[submetric_id] !== 'undefined' ? new_value[submetric_id] : null;
		var submetric_old_value = typeof old_value[submetric_id] !== 'undefined' ? old_value[submetric_id] : null;

		submetric.type.adjust_score( submetric_score, submetric_new_value, submetric_old_value, submetric );

		submetric_data[submetric_id] = submetric_score;
		score.average += submetric_score.average * submetric.weight;
	}

	// Average the score of each submetric.
	score.average /= submetrics.length;
	score.sorting = score.average;
	score.display = score.average;
	score.data = submetric_data;
}

module.exports.validate_options = function( options ) {
	DEBUG_VOTE("Validating options", options);
	return UTIL.keep( options, ['title', 'blueprint'] );
}
