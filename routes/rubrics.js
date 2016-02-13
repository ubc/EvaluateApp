
const EXPRESS = require('express');
const PROMISE = require('sequelize').Promise;
const JADE = require('jade')
const RUBRIC = require('../models/rubric');
const SUBMETRIC = require('../models/submetric');
const SUBMETRIC_TYPES = require('../metric-types');
const DEBUG = require('debug')('eval:routing');

var router = EXPRESS.Router();

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

	promises.push( RUBRIC.findById( req.params.rubric_id ) );

	promises.push( SUBMETRIC.findAll( {
		where: { rubric_id: req.params.rubric_id },
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
			submetrics: submetrics,
		} );

		res.render( 'rubrics/editor', data );
	} );
});

function add_metric_type_data( data ) {
	// TODO: Cache the results of this call, either manually or using Jade's cache. http://jade-lang.com/api/
	data['metric_types'] = {};

	for ( var slug in SUBMETRIC_TYPES ) {
		data['metric_types'][slug] = SUBMETRIC_TYPES[slug].title;
		data['render_'+slug] = JADE.compileFile( __dirname + "/../metric-types/" + slug + "/options.jade" );
	}

	return data;
}

function save_rubric( req, res, next ) {
	var data = req.body;
	var promises = [];

	var rubric_id = data.rubric_id;
	delete data.rubric_id;

	var submetrics = data.submetrics;
	delete data.submetrics;

	// TODO: Validate the data input.

	if ( rubric_id == null ) {
		DEBUG( "Saving rubric", data );
		promises.push( RUBRIC.create( data ) );
	} else {
		DEBUG( "Updating rubric", rubric_id, data );
		promises.push( RUBRIC.update( data, {
			where: { rubric_id: rubric_id },
		} ) );
	}

	PROMISE.all( promises ).spread( function( rubric ) {
		rubric_id = rubric_id || rubric.rubric_id;
		DEBUG( "Rubric stored", rubric_id );
		res.redirect( '/rubrics/edit/' + rubric_id );
	} );
}

router.post( '/edit/:metric_id', save_rubric );
router.post( '/create', save_rubric );

// TODO: Implement delete

module.exports = router;
