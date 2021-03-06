
/**
 * This module handles requests to all the `/blueprints/*` paths.
 * For detailed information on these paths, see `documentation/Developer.md`
 */

const EXPRESS = require('express');
const PROMISE = require('sequelize').Promise;
const BLUEPRINT = require('../models/blueprint');
const SUBMETRIC = require('../models/submetric');
const SUBMETRIC_TYPES = require('../metric-types');
const TRANSACTION = require('../includes/transaction');
const UTIL = require('../includes/util');
const DEBUG = require('debug')('eval:blueprints');

var router = EXPRESS.Router();

// Provides a list of all blueprints, associated with the given api key.
router.get( '/list/:api_key', function( req, res ) {
	// Request the blueprints from the database.
	BLUEPRINT.findAll( {
		where: { api_key: req.params.api_key },
	} ).then( function( results ) {
		// Send the results to the client.
		res.status(200).json( results );
	} );
} );

// Renders the blueprint editor, given a valid transaction id.
router.get('/edit/:transaction_id', function( req, res ) {
	// Check that the required parameters are in place.
	if ( UTIL.is_missing_attributes( ['blueprint_id'], req.params.transaction, res ) ) { return; }
	var blueprint_id = req.params.transaction.blueprint_id;
	var api_key = req.params.transaction.api_key;
	var promises = [];

	if ( blueprint_id ) {
		// Request the blueprint that you want to edit.
		promises.push( BLUEPRINT.findOne( {
			where: {
				blueprint_id: blueprint_id,
				api_key: api_key,
			},
			include: [{ model: SUBMETRIC }],
		} ) );
	}

	// Get the list of valid submetrics.
	var metric_types = [];
	for ( var slug in SUBMETRIC_TYPES ) {
		if ( SUBMETRIC_TYPES[slug].valid_as_submetric !== false ) {
			metric_types.push( SUBMETRIC_TYPES[slug] );
		}
	}

	// Wait for the database request to resolve.
	PROMISE.all( promises ).spread( function( blueprint ) {
		// The data to incorporate into the transactions.
		var transaction_data = {
			blueprint_id: blueprint_id,
			api_key: api_key,
		};

		// Generate the transactions to embed in the editor.
		var transactions = {
			submit_id: TRANSACTION.create( "/blueprints/save", transaction_data ),
			delete_id: TRANSACTION.create( "/blueprints/destroy", transaction_data ),
		};

		if ( blueprint_id && blueprint == null ) {
			res.status(404).send("The requested blueprint does not exist.");
		} else {
			// Render the editor.
			res.status(200).render( 'blueprints/editor', {
				title: blueprint != null ? "Edit Rubric" : "Create Rubric",
				blueprint: blueprint != null ? blueprint : { options: {} },
				metric_types: metric_types,
				transactions: transactions,
			} );
		}
	} );
});

// Saves or creates a blueprint, given a valid transaction id.
router.post( '/save/:transaction_id', function( req, res, next ) {
	// Get the blueprint id from the transaction.
	var blueprint_id = req.params.transaction.blueprint_id || null;
	// Is this going to be a new blueprint?
	var is_new_blueprint = blueprint_id == null
	// Get the data that defines this new blueprint.
	var data = req.body;
	// Extract the submetrics to save from the data.
	var submetrics = data.submetrics || [];
	delete data.submetrics;

	// The promise from our database request.
	var promise = null;

	if ( is_new_blueprint ) {
		// If there is no blueprint_id then create a new one.
		DEBUG( "Creating Blueprint", data );
		data.api_key = req.params.transaction.api_key;
		// Create a blueprint.
		promise = BLUEPRINT.create( data );
	} else {
		DEBUG( "Updating Blueprint", blueprint_id, data );
		// Update the existing blueprint.
		promise = BLUEPRINT.update( data, {
			where: {
				blueprint_id: blueprint_id,
				api_key: req.params.transaction.api_key,
			},
		} );
	}

	// When the creation or updating is finished, then we can save the submetrics.
	promise.then( function( result ) {
		if ( is_new_blueprint ) {
			// If this was a create operation.
			blueprint_id = result.blueprint_id;
		} else {
			// If this was an update operation.
			affected_row_count = result[0]
			
			if ( affected_row_count < 1 ) {
				res.status(404).send( "The blueprint you attempted to update does not exist." );
				return;
			}
		}

		DEBUG( "Blueprint Saved", blueprint_id, "with", submetrics.length, "submetrics" );

		// Extract the IDs of each submetric.
		var submetric_ids = [];

		for ( var i in submetrics ) {
			var submetric_id = submetrics[i].id;
			if ( typeof submetric_id !== 'undefined' ) {
				submetric_ids.push( submetric_id );
			}
		}

		// Delete any submetrics which were not updated (meaning they were removed on the front end).
		SUBMETRIC.destroy( {
			where: {
				blueprint_id: blueprint_id,
				id: {
					$notIn: submetric_ids,
				},
			},
		} ).then( function() {
			// Wait for all deletions before we insert anything.
			var promises = [];

			// Update or insert all the submetrics that were saved.
			for ( var i in submetrics ) {
				var submetric = submetrics[i];
				submetric.blueprint_id = blueprint_id; // Make sure to include the id of the submetric's parent.

				DEBUG( "Saving Submetric", submetric );
				promises.push( SUBMETRIC.upsert( submetric ) );
			}

			// Wait for all submetrics to complete
			PROMISE.all( promises ).spread( function() {
				if ( is_new_blueprint ) {
					var transaction_data = req.params.transaction;
					transaction_data.blueprint_id = blueprint_id;

					res.status(201).json( {
						// Send them an editor transaction.
						edit_transaction_id: TRANSACTION.create( "/blueprints/edit", transaction_data ),
					} );
				} else {
					res.status(200).json( {
						// Renew their transaction so that they can save again if they want.
						save_transaction_id: TRANSACTION.renew( req.params.transaction_id ),
					} );
				}
			} );
		} );
	} );
} );

// Destroys a blueprint, given a valid transaction id.
router.post( '/destroy/:transaction_id', function( req, res ) {
	if ( UTIL.is_missing_attributes( ['blueprint_id'], req.params.transaction, res ) ) { return; }
	// Extract the blueprint id.
	var blueprint_id = req.params.transaction.blueprint_id;
	// Extract the api key.
	var api_key = req.params.transaction.api_key;

	BLUEPRINT.destroy( {
		where: {
			blueprint_id: blueprint_id,
			api_key: api_key,
		},
	} ).then( function( affected_row_count ) {
		if ( affected_row_count > 0 ) {
			DEBUG( "Destroyed Blueprint", blueprint_id );
			// Related Submetric objects wil be destroyed via cascade.
		} else {
			DEBUG( "No Blueprint Destroyed", blueprint_id );
		}
	} );

	res.status(202).send("inprogress");
} );

module.exports = router;
