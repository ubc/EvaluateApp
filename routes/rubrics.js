
const EXPRESS = require('express');
const PROMISE = require('sequelize').Promise;
const JADE = require('jade')
const RUBRIC = require('../models/rubric');
const SUBMETRIC = require('../models/submetric');
const SUBMETRIC_TYPES = require('../metric-types');
const DEBUG = require('debug')('eval:routing');

var router = EXPRESS.Router();

// TODO: Check authorization on these handlers.

/* GET home page. */
router.get('/', function(req, res, next) {
	RUBRIC.findAll().then( function( results ) {
		res.render( 'rubrics/list', {
			title: "Rubrics List",
			path: req.originalUrl,
			rubrics: results,
		} );
	} );
});

router.get('/create', function( req, res ) {
	var rubric = { options: {} };

	var data = add_metric_type_data( {
		title: "Create Rubric",
		path: req.originalUrl,
		rubric: rubric,
		submetrics: [],
	} );

	res.render( 'rubrics/editor', data );
});

router.get('/edit/:rubric_id', function( req, res ) {
	var promises = [];

	promises.push( RUBRIC.findOne( {
		where: { rubric_id: req.params.rubric_id },
		include: [{ model: SUBMETRIC }],
	} ) );

	PROMISE.all( promises ).spread( function( rubric, submetrics ) {
		if ( rubric == null ) {
			res.send( "No rubric #" + req.params.rubric_id + " found." );
			return;
		}

		var data = add_metric_type_data( {
			title: "Edit Rubric",
			path: req.originalUrl,
			rubric: rubric,
		} );

		res.render( 'rubrics/editor', data );
	} );
});

function add_metric_type_data( data ) {
	// TODO: Cache the results of this call, either manually or using Jade's cache. http://jade-lang.com/api/
	data['metric_types'] = {};

	for ( var slug in SUBMETRIC_TYPES ) {
		if ( SUBMETRIC_TYPES[slug].valid_as_submetric !== false ) {
			data['metric_types'][slug] = SUBMETRIC_TYPES[slug].title;
			data['render_'+slug] = JADE.compileFile( __dirname + "/../metric-types/" + slug + "/options.jade" );
		}
	}

	return data;
}

function save_rubric( req, res, next ) {
	var rubric_id = req.params.rubric_id || null;
	var data = req.body;

	var promise = null;
	var submetrics = data.submetrics;
	delete data.submetrics;

	if ( rubric_id == null ) {
		DEBUG( "Saving rubric", data );
		promise = RUBRIC.create( data );
	} else {
		DEBUG( "Updating rubric", rubric_id, data );
		promise = RUBRIC.update( data, {
			where: { rubric_id: rubric_id },
		} );
	}

	promise.then( function( rubric ) {
		rubric_id = rubric_id || rubric.rubric_id;
		DEBUG( "Rubric stored", rubric_id, "with", submetrics.length, "submetrics" );

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
				rubric_id: rubric_id,
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
				submetric.rubric_id = rubric_id
				DEBUG( "Saving submetric", submetric );
				promises.push( SUBMETRIC.upsert( submetric ) );
			}

			PROMISE.all( promises ).spread( function() {
				res.redirect( '/rubrics/edit/' + rubric_id );
			} );
		} );
	} );
}

router.post( '/edit/:rubric_id', save_rubric );
router.post( '/create', save_rubric );

router.get( '/destroy/:rubric_id', function( req, res ) {
	var rubric_id = req.params.rubric_id;

	RUBRIC.findById( rubric_id ).then( function( rubric ) {
		if ( rubric != null ) {
			res.render( 'rubrics/destroy', {
				title: "Delete Rubric",
				rubric: rubric,
			} );
		} else {
			res.status(404).render('error', {
				message: "There is no Rubric with id #" + rubric_id,
				error: {
					status: "404 Rubric Not Found",
				},
			});
		}
	} );
} );

router.post( '/destroy/:rubric_id', function( req, res ) {
	var rubric_id = req.params.rubric_id;
	var promises = [];

	promises.push( RUBRIC.destroy( {
		where: { rubric_id: rubric_id },
	} ) );

	promises.push( SUBMETRIC.destroy( {
		where: { rubric_id: rubric_id },
	} ) );

	PROMISE.all( promises ).spread( function() {
		res.redirect( '/rubrics' );
	} );
} );

module.exports = router;
