
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
	//DEBUG_VOTE("Adjusting rubric score", score);
	// TODO: Get score for each submetric.
}

module.exports.validate_options = function( options ) {
	DEBUG_VOTE("Validating options", options);
	return UTIL.keep( options, ['title', 'blueprint'] );
}