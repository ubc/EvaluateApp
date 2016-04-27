
const EXPRESS = require('express');
const PROMISE = require('sequelize').Promise;
const BLUEPRINT = require('../models/blueprint');
const SUBMETRIC = require('../models/submetric');
const SUBMETRIC_TYPES = require('../metric-types');
const TRANSACTION = require('../includes/transaction');
const UTIL = require('../includes/util');
const DEBUG = require('debug')('eval:routing');

var router = EXPRESS.Router({ mergeParams: true });

router.get( '/list/:api_key', function( req, res ) {
	BLUEPRINT.findAll( {
		where: { api_key: req.params.api_key },
	} ).then( function( results ) {
		res.status(200).send(results);
	} );
} );

router.get('/edit/:transaction_id', function( req, res ) {
	if ( UTIL.is_missing_attributes( ['blueprint_id'], req.params.transaction, res ) ) { return; }
	var blueprint_id = req.params.transaction.blueprint_id;
	var api_key = req.params.transaction.api_key;
	var promises = [];

	if ( blueprint_id ) {
		promises.push( BLUEPRINT.findOne( {
			where: {
				blueprint_id: blueprint_id,
				api_key: api_key,
			},
			include: [{ model: SUBMETRIC }],
		} ) );
	}

	var metric_types = [];
	for ( var slug in SUBMETRIC_TYPES ) {
		if ( SUBMETRIC_TYPES[slug].valid_as_submetric !== false ) {
			metric_types.push( SUBMETRIC_TYPES[slug] );
		}
	}

	PROMISE.all( promises ).spread( function( blueprint ) {
		var transaction_data = {
			blueprint_id: blueprint_id,
			api_key: api_key,
		};

		var transactions = {
			submit_id: TRANSACTION.create( "/blueprints/save", transaction_data ),
			delete_id: TRANSACTION.create( "/blueprints/destroy", transaction_data ),
		};

		if ( blueprint_id && blueprint == null ) {
			res.status(404).send("The requested blueprint does not exist.");
		} else {
			res.status(200).render( 'blueprints/editor', {
				title: blueprint != null ? "Edit Rubric" : "Create Rubric",
				blueprint: blueprint != null ? blueprint : { options: {} },
				metric_types: metric_types,
				transactions: transactions,
			} );
		}
	} );
});

router.post( '/save/:transaction_id', function( req, res, next ) {
	var blueprint_id = req.params.transaction.blueprint_id || null;
	var data = req.body;

	var promise = null;
	var submetrics = data.submetrics;
	delete data.submetrics;

	if ( blueprint_id == null ) {
		DEBUG( "Creating blueprint", data );
		data.api_key = req.params.transaction.api_key;
		promise = BLUEPRINT.create( data );
	} else {
		DEBUG( "Updating blueprint", blueprint_id, data );
		promise = BLUEPRINT.update( data, {
			where: { blueprint_id: blueprint_id },
		} );
	}

	promise.then( function( blueprint ) {
		blueprint_id = blueprint_id || blueprint.blueprint_id;
		DEBUG( "Blueprint saved", blueprint_id, "with", submetrics.length, "submetrics" );

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
				submetric.blueprint_id = blueprint_id
				DEBUG( "Saving submetric", submetric );
				promises.push( SUBMETRIC.upsert( submetric ) );
			}

			PROMISE.all( promises ).spread( function() {
				var transaction_id = TRANSACTION.renew( req.params.transaction_id );
				res.status(200).json( { transaction_id: transaction_id } );
			} );
		} );
	} );
} );

router.post( '/destroy/:transaction_id', function( req, res ) {
	if ( UTIL.is_missing_attributes( ['blueprint_id'], req.params.transaction, res ) ) { return; }

	BLUEPRINT.destroy( {
		where: { blueprint_id: req.params.transaction.blueprint_id },
	} ).then( function() {
		res.status(200).send("success");
	} );
} );

module.exports = router;
