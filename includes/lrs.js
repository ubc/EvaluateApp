
const CONFIG = require('../config');
const LRS = require('adl-xapiwrapper');

LRS.debugLevel = 'info';

if ( CONFIG.lrs ) {
	var lrs = new LRS.XAPIWrapper( CONFIG.lrs );
}

module.exports = {
	send: function( statements ) {
		if ( typeof lrs !== 'undefined' ) {
			lrs.sendStatements( statements, function( err, response, body ) {
				LRS.log( 'info', response.statusCode );
				LRS.log( 'info', body );
			})
		} // else there is no LRS configured, so we should silently fail.
	}
}
