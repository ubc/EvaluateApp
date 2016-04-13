
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../../includes/util');

module.exports = {
	title: "Value List",
	slug: "valuelist",
	valid_as_submetric: true,
};

module.exports.validate_vote = function( new_values, metric ) {
	DEBUG_VOTE("Validating valuelist vote", new_values, metric.options)
	if ( new_values === '' || new_values == null ) {
		return null;
	} else if ( ! ( new_values instanceof Array ) ) {
		new_values = [new_values]
	}

	choices = parse_choices( metric.options['choices'] );

	for (var i = new_values.length - 1; i >= 0; i--) {
		if ( new_values[i] == null || ! (new_values[i] in choices) ) {
			delete new_values[i];
			DEBUG_VOTE("Value n", null, i);
		} else {
			new_values[i] = parseInt( new_values[i] );
			DEBUG_VOTE("Value", new_values[i], i);
		}
	}

	DEBUG_VOTE("Valuelist vote", new_values.length);
	if ( new_values.length > 0 ) {
		DEBUG_VOTE("Validated valuelist vote", new_values);
		return new_values;
	} else {
		DEBUG_VOTE("Validated valuelist vote", null);
		return null;
	}
}

module.exports.adjust_score = function( score, new_values, old_values, metric ) {
	options = metric.options || {};
	score.count = score.count || 0;
	score.average = score.average ? score.average * score.count : 0;

	if ( new_values !== old_values ) {
		if ( new_values === null ) {
			score.count--;
		} else if ( old_values === null ) {
			score.count++;
		}
	}

	choices = parse_choices( options['choices'] );
	vote_diff = calculate_score( new_values, choices ) - calculate_score( old_values, choices );

	if ( score.count == 0 ) {
		score.average = 0;
		score.display = 0;
		score.sorting = 0;
	} else {
		score.average = ( score.average + vote_diff ) / score.count;
		score.display = score.average;
		score.sorting = score.average; // TODO: Consider a better sorting method.
	}
}

module.exports.validate_options = function( options ) {
	return UTIL.keep( options, ['title', 'choices', 'multiselect'] );
}

function parse_choices( raw_choices ) {
	raw_choices = raw_choices.split( /\r?\n/ );

	choices = {}
	for ( var i = raw_choices.length - 1; i >= 0; i-- ) {
		var split = raw_choices[i].split("|", 2);
		choices[i] = split[0];
	}

	return choices;
}

function calculate_score( values, choices ) {
	result = 0;

	if ( values != null ) {
		for (var i = values.length - 1; i >= 0; i--) {
			var index = values[i];
			result += parseFloat(choices[index]);
		}
	}

	return result;
}
