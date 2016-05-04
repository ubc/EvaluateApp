
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

module.exports = {
	title: "Rubric",
	slug: "rubric",
	valid_as_submetric: false,
	has_submetrics: true,
};

module.exports.validate_vote = function( new_value, metric, submetrics ) {
	try {
		new_value = JSON.parse( new_value );
	} catch (err) {
		DEBUG_VOTE("Error", err.message);
		new_value = null
	}

	if ( typeof new_value === 'object' ) {
		// Validate vote for each submetric.
		for ( var i in new_value ) {
			var submetric = UTIL.select_from( submetrics, { id: i } );
			new_value[i] = submetric.type.validate_vote( new_value[i], submetric );
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

	// TODO: Check that the score is being set properly for rubrics.
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
		var submetric_new_value = submetric_id in new_value ? new_value[submetric_id] : null;
		var submetric_old_value = submetric_id in old_value ? old_value[submetric_id] : null;

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
	return UTIL.keep( options, ['title', 'blueprint'] );
}
