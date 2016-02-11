
const DEBUG = require('debug')('eval:manage');
const EXPRESS = require('express');
const METRIC = require('../models/metric');

var router = EXPRESS.Router();

router.get('/', function( req, res, next ) {
	METRIC.findAll().then( function( results ) {
		res.render('list', {
			title: "Metrics List",
			path: req.originalUrl,
			metrics: results,
		});
	});
});

router.get('/create', function( req, res, next ) {
	res.render( 'editor', {
		title: "Create",
			path: req.originalUrl,
		metric: { options: {} },
	 });
});

router.get('/edit/:id', function( req, res, next ) {
	METRIC.findOne( {
		where: { metric_id: req.params.id },
	} ).then( function( metric ) {
		if ( metric == null ) {
			res.send( "No metric #" + req.params.id + " found." );
			return;
		}

		res.render('editor', {
			title: "Edit Metric",
			path: req.originalUrl,
			metric_id: metric.metric_id,
			metric: metric,
		});
	} );
});

function save_metric( req, res, next ) {
	var data = req.body;

	if ( data.id == null ) {
		DEBUG( "Saving metric", data );
		METRIC.create( data ).then( function( metric ) {
			DEBUG( "Metric created", metric.metric_id );
			res.redirect( '/manage/edit/' + metric.metric_id );
		} );
	} else {
		metric_id = data.id;
		delete data.id;

		DEBUG( "Updating metric", metric_id, data );
		METRIC.update( data, {
			where: { metric_id: metric_id },
		} ).then( function() {
			DEBUG( "Metric updated", metric_id );
			res.redirect( '/manage/edit/' + metric_id );
		} );
	}
}

router.post( '/edit/:id', save_metric );
router.post( '/create', save_metric );

module.exports = router;
