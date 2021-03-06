
/**
 * This module handles requests to all the `/xapi/*` paths.
 */

const EXPRESS = require('express');

var router = EXPRESS.Router();

// Provide a definition for the 'choice' result
router.get( '/choice', function( req, res, next ) {
	res.status(200).json( {
		name: { "en-US": "choice" },
		description: {
			"en-US": "The choice of rating made by the user, for this metric and context."
		}
	} );
} );

// Provide a definition for the 'average' result
router.get( '/average', function( req, res, next ) {
	res.status(200).json( {
		name: { "en-US": "average" },
		description: {
			"en-US": "The metric's average rating for this context."
		}
	} );
} );

module.exports = router;
