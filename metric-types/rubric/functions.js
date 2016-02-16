
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

module.exports.slug = "rubric";
module.exports.title = "Rubric";

module.exports.validate_vote = function( new_value, old_value, metric ) {
	// Validate vote for each submetric.
}

module.exports.adjust_score = function( score, new_value, old_value, metric ) {
	// Get score for each submetric.
}

module.exports.validate_options = function( options ) {
	DEBUG_VOTE("Validating options", options);
	return UTIL.keep( options, ['title', 'blueprint'] );
}