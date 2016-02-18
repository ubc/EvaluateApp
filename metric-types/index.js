
const FILE = require("fs");

module.exports = {};

// TODO: Add checklist metric type (values associated with words)

FILE.readdirSync( __dirname ).forEach( function( file ) {
	if ( file != "index.js" ) {
		var object = require( "./" + file + "/functions.js" );

		if ( typeof object !== 'undefined' && object.slug != null ) {
			module.exports[ object.slug ] = object;
		}
	}
} );
