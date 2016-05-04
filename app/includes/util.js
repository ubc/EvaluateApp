
const TRANSACTION = require('../includes/transaction');
const CONFIG = require('../config');
const DEBUG = require('debug')('eval:security');

module.exports.defaults = function( map_defaults, map_values ) {
	if ( map_values != null ) {
		for ( var key in map_defaults ) {
			if ( map_values.hasOwnProperty( key ) ) {
				map_defaults[key] = map_values[key];
			}
		}
	}

	return map_defaults;
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

module.exports.is_missing_attributes = function( attributes, data, res ) {
	for ( var i in attributes ) {
		var key = attributes[i];
		if ( ! ( key in data ) ) {
			res.status(400).send("Missing attribute: " + key + " for request.");
			return true;
		}
	}

	return false;
}

module.exports.parse_transaction_id = function( req, res, next, id ) {
	var path = req.originalUrl.replace(/\/+$/, "").split("/");
	path.pop();
	path = path.join("/");

	var data = TRANSACTION.redeem( id, path );

	if ( data == false ) {
		// This means that the transaction authorization failed.
		DEBUG( "Invalid Transaction", "Requested by", req.headers['x-forwarded-for'] || req.connection.remoteAddress );
		res.status(401).send( "Transaction check failed. Your session may have expired, try refreshing the page." ); // Return a failure.
	} else {
		req.params.transaction = data;
		res.locals.stylesheet = data.stylesheet;

		res.on( 'finish', function() {
			TRANSACTION.cleanup( id );
		} );

		next();
	}
};

module.exports.parse_api_key = function( req, res, next, key ) {
	if ( CONFIG.api_keys.indexOf( key ) < 0 ) {
		DEBUG( "Invalid API Key", "Requested by", req.headers['x-forwarded-for'] || req.connection.remoteAddress );
		res.status(403).send( "API key is not authorized" );
	} else {
		DEBUG( "Validated API Key", key );
		next();
	}
};
