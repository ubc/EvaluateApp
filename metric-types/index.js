
const FILE = require("fs");

module.exports = {};

FILE.readdirSync( __dirname ).forEach( function( file ) {
	if ( file != "index.js" && file != "rubric" ) { // TODO: Enable and implement Rubrics.
		var object = require( "./" + file + "/functions.js" );

		// TODO: Check the file exists and do not include if slug is undefined.
		module.exports[ object.slug ] = object;
	}
} );
