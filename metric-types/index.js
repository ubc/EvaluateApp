
const FILE = require("fs");

module.exports = {};

FILE.readdirSync( __dirname ).forEach( function( file ) {
	if ( file != "index.js" ) {
		var object = require( "./" + file + "/functions.js" );

		if ( typeof object !== 'undefined' && object.slug != null ) {
			module.exports[ object.slug ] = object;
		}
	}
} );
