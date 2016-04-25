
const CONFIG = require('../config');
const ADL = require('adl-xapiwrapper');

ADL.debugLevel = 'info';

if ( CONFIG.lrs ) {
	var lrs = new ADL.XAPIWrapper( CONFIG.lrs );
}

module.exports = {
	send: function( statements ) {
		if ( typeof lrs !== 'undefined' ) {
			lrs.sendStatements( statements, function( err, response, body ) {
				ADL.log( 'info', response.statusCode );
				ADL.log( 'info', body );
			})
		} // else there is no LRS configured, so we should silently fail.
	}
}
