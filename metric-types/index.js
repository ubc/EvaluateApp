
const JADE = require('jade')
const PATH = require('path');
const FILE = require("fs");

module.exports = {};

// TODO: Add checklist metric type (values associated with words)

function render_options( data ) {
	return JADE.renderFile( PATH.join( __dirname, this.slug, "options.jade" ), data );
}

function render_display( data ) {
	return JADE.renderFile( PATH.join( __dirname, this.slug, "display.jade" ), data );
}

FILE.readdirSync( __dirname ).forEach( function( file ) {
	if ( file != "index.js" ) {
		var object = require( "./" + file + "/functions.js" );

		if ( typeof object !== 'undefined' && object.slug != null ) {
			object.render_options = render_options;
			object.render_display = render_display;
			module.exports[ object.slug ] = object;
		}
	}
} );
