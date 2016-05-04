
/**
 * This module automatically collates all the metric types, and parses their jade files.
 */

const JADE = require('jade')
const PATH = require('path');
const FILE = require("fs");

// Initialize the map to hold all our metric types.
module.exports = {};

// A helper function for rendering a metric type's options file.
function render_options( data ) {
	return JADE.renderFile( PATH.join( __dirname, this.slug, "options.jade" ), data );
}

// A helper function for rendering a metric type's display file.
function render_display( data ) {
	return JADE.renderFile( PATH.join( __dirname, this.slug, "display.jade" ), data );
}

// Loop through each file in the current directory.
FILE.readdirSync( __dirname ).forEach( function( file ) {
	// Loop through every folder (signified by files without a '.'').
	if ( file.indexOf(".") == -1 ) {
		// Make sure that the metric type has a functions file.
		var object = require( "./" + file + "/functions.js" );

		if ( typeof object !== 'undefined' && object.slug != null ) {
			// Add the rendering functions.
			object.render_options = render_options;
			object.render_display = render_display;

			// Add the metric type to 
			module.exports[ object.slug ] = object;
		}
	}
} );
