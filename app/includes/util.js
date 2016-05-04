/**
 * This module provides generic utility functions, as well as a home for a couple functions which have no other appopriate location.
 */

const TRANSACTION = require('../includes/transaction');
const CONFIG = require('../config');
const DEBUG = require('debug')('eval:security');

/**
 * Takes two maps, and uses the defaults to fill in keys on the second map.
 * @param {array} map_defaults - The default values to use where map_values does not have a key.
 * @param {array} map_values - The desired values.
 */
module.exports.defaults = function( map_defaults, map_values ) {
	// Check that map_values is defined.
	if ( map_values != null ) {
		// Loop through each key in the defaults.
		for ( var key in map_defaults ) {
			// If there exists a value in map_values, then overwrite the default.
			if ( map_values.hasOwnProperty( key ) ) {
				map_defaults[key] = map_values[key];
			}
		}
	}

	// Return the result.
	return map_defaults;
}

/**
 * Takes a map, and removes unexpected keys.
 * @param {array} object - The map to process.
 * @param {array} keys - An array of strings, signifying the keys which are expected.
 */
module.exports.keep = function( object, keys ) {
	// Loop through each key in the array.
	for ( var key in object ) {
		// Remove the key if it isn't in the list of expected keys.
		if ( keys.indexOf(key) == -1 ) {
			delete object[key];
		}
	}

	// Return the result.
	return object;
}

/**
 * Loop through an array of maps, and pick out the map where certain values are present.
 * @param {array} list - The list of maps to look through.
 * @param {array} where - A map of key/value pairs that should be present in the object we are looking for.
 */
module.exports.select_from = function( list, where ) {
	loop:
	for ( var i in list ) {
		// Loop through each where condition.
		for ( var k in where ) {
			if ( list[i][k] != where[k] ) {
				// If one of the conditions doesn't match, escape to the outer loop.
				continue loop;
			}
		}

		// If the loop hasn't already been escaped, then we have found a match. Return it.
		return list[i];
	}
}

/**
 * This function is intended to help handle incoming HTTP requests.
 * It checks to make sure that required attributes exist, and if not responds with an error.
 * @param {array} attributes - A list representing required attribute keys.
 * @param {array} data - A map in which to look for the required attributes.
 * @param {Response} res - An Express "Response" object, where we can report an error if some attributes are missing.
 * @return true if some attributes are missing, otherwise false.
 */
module.exports.is_missing_attributes = function( attributes, data, res ) {
	// Loop through the required attributes.
	for ( var i in attributes ) {
		var key = attributes[i];

		// Check if the attribute is missing from the data map.
		if ( ! ( key in data ) ) {
			// If so, send an error.
			res.status(400).send("Missing attribute: " + key + " for request.");
			return true;
		}
	}

	return false;
}

/**
 * This is an Express middleware function which parses out the :transaction_id parameter, verifies it, and makes the transaction data available.
 */
module.exports.parse_transaction_id = function( req, res, next, id ) {
	// Extract the path of this request.
	var path = req.originalUrl.replace(/\/+$/, "").split("/");
	path.pop(); // This statement is to pull off the "/:transaction_id" part of the path.
	path = path.join("/");

	// Redeem the transaction, using our current path as the action.
	var data = TRANSACTION.redeem( id, path );

	if ( data == false ) {
		// This means that the transaction authorization failed. Return an error.
		DEBUG( "Invalid Transaction", "Requested by", req.headers['x-forwarded-for'] || req.connection.remoteAddress );
		res.status(401).send( "Transaction check failed. Your session may have expired, try refreshing the page." ); // Return a failure.
	} else {
		// If the transaction redemption succeeded.

		// Save the transaction data.
		req.params.transaction = data;

		// If a stylesheet is defined, insert it into the "locals" so that it can be used by Jade (our HTML preprocessor)
		res.locals.stylesheet = data.stylesheet;

		// When the response has been set, make sure we clean up the transaction.
		res.on( 'finish', function() {
			TRANSACTION.cleanup( id );
		} );

		// Go to the next middleware for handling this request.
		next();
	}
};

/**
 * This is an Express middleware function which parses out the :api_key parameter and verifies it.
 */
module.exports.parse_api_key = function( req, res, next, key ) {
	// Check if the api key has been defined in our configuration.
	if ( CONFIG.api_keys.indexOf( key ) < 0 ) {
		// If not, throw an error.
		DEBUG( "Invalid API Key", "Requested by", req.headers['x-forwarded-for'] || req.connection.remoteAddress );
		res.status(403).send( "API key is not authorized" );
	} else {
		// If the key is valid, continue to the next middleware.
		DEBUG( "Validated API Key", key );
		next();
	}
};
