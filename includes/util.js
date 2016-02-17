
module.exports.defaults = function( map_defaults, map_values ) {
	console.log("defaults", map_defaults);
	for ( var key in map_defaults ) {
		console.log("check for", key, "in", map_values);
		if ( map_values.hasOwnProperty( key ) ) {
			console.log("found", key, "in", map_values);
			map_defaults[key] = map_values[key];
		}
	}

	console.log("results", map_defaults);
	return map_defaults;
};

module.exports.validate_vote = function( new_value, old_value ) {
	new_value = parseInt( new_value );

	if ( isNaN( new_value ) || new_value == old_value ) {
		return null;
	} else {
		return new_value;
	}
}

module.exports.keep = function( object, keys ) {
	for ( var key in object ) {
		if ( keys.indexOf(key) == -1 ) {
			delete object[key];
		}
	}

	return object;
}

module.exports.select_from = function( list, where ) {
	loop:
	for ( var i in list ) {
		for ( var k in where ) {
			if ( list[i][k] != where[k] ) {
				continue loop;
			}
		}

		return list[i];
	}
}
