
const EXPRESS = require('express');
const PROMISE = require('sequelize').Promise;
const BLUEPRINT = require('../models/blueprint');
const SUBMETRIC = require('../models/submetric');
const SUBMETRIC_TYPES = require('../metric-types');
const DEBUG = require('debug')('eval:routing');
const PASSPORT = require('passport');
const AUTH = require('../includes/authentication')

var router = EXPRESS.Router();

router.use( AUTH.require_login );

/* GET home page. */
router.all('/', function(req, res, next) {
	BLUEPRINT.findAll().then( function( results ) {
		res.status(200).render( 'blueprints/list', {
			title: "Rubrics List",
			path: req.originalUrl,
			blueprints: results,
		} );
	} );
});

router.get('/create', function( req, res ) {
	var blueprint = { options: {} };
	var metric_types = [];

	for ( var slug in SUBMETRIC_TYPES ) {
		if ( SUBMETRIC_TYPES[slug].valid_as_submetric !== false ) {
			metric_types.push( SUBMETRIC_TYPES[slug] );
		}
	}

	res.status(200).render( 'blueprints/editor', {
		title: "Create Rubric",
		path: req.originalUrl,
		blueprint: blueprint,
		submetrics: [],
		metric_types: metric_types,
	} );
});

router.get('/edit/:blueprint_id', function( req, res ) {
	var promises = [];

	promises.push( BLUEPRINT.findOne( {
		where: { blueprint_id: req.params.blueprint_id },
		include: [{ model: SUBMETRIC }],
	} ) );

	PROMISE.all( promises ).spread( function( blueprint, submetrics ) {
		if ( blueprint == null ) {
			res.status(404).send( "No rubric blueprint #" + req.params.blueprint_id + " found." );
			return;
		}

		var metric_types = [];
		for ( var slug in SUBMETRIC_TYPES ) {
			if ( SUBMETRIC_TYPES[slug].valid_as_submetric !== false ) {
				metric_types.push( SUBMETRIC_TYPES[slug] );
			}
		}

		res.status(200).render( 'blueprints/editor', {
			title: "Edit Rubric",
			path: req.originalUrl,
			blueprint: blueprint,
			metric_types: metric_types,
		} );
	} );
});

function save_blueprint( req, res, next ) {
	var blueprint_id = req.params.blueprint_id || null;
	var data = req.body;

	var promise = null;
	var submetrics = data.submetrics;
	delete data.submetrics;

	if ( blueprint_id == null ) {
		DEBUG( "Saving blueprint", data );
		promise = BLUEPRINT.create( data );
	} else {
		DEBUG( "Updating blueprint", blueprint_id, data );
		promise = BLUEPRINT.update( data, {
			where: { blueprint_id: blueprint_id },
		} );
	}

	promise.then( function( blueprint ) {
		blueprint_id = blueprint_id || blueprint.blueprint_id;
		DEBUG( "Blueprint stored", blueprint_id, "with", submetrics.length, "submetrics" );

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
				res.status(303).redirect( '/blueprints/edit/' + blueprint_id );
			} );
		} );
	} );
}

router.post( '/save/:blueprint_id', save_blueprint );
router.post( '/save', save_blueprint );

router.get( '/destroy/:blueprint_id', function( req, res ) {
	var blueprint_id = req.params.blueprint_id;

	BLUEPRINT.findById( blueprint_id ).then( function( blueprint ) {
		if ( blueprint != null ) {
			res.status(200).render( 'blueprints/destroy', {
				title: "Delete Rubric",
				blueprint: blueprint,
			} );
		} else {
			res.status(404).render('error', {
				message: "There is no Rubric blueprint with id #" + blueprint_id,
				error: {
					status: "404 Blueprint Not Found",
				},
			});
		}
	} );
} );

router.post( '/destroy/:blueprint_id', function( req, res ) {
	BLUEPRINT.destroy( {
		where: { blueprint_id: req.params.blueprint_id },
	} ).then( function() {
		res.status(303).redirect( '/blueprints' );
	} );
} );

module.exports = router;
