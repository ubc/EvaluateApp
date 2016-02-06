
const DEBUG = require('debug')('eval:manage');
const EXPRESS = require('express');
const METRIC = require('../models/metric');

var router = EXPRESS.Router();

router.get('/', function( req, res, next ) {
	METRIC.findAll().then( function( results ) {
		res.render('list', {
			title: "Metrics List",
			metrics: results,
		});
	});
});

router.get('/create', function( req, res, next ) {
	res.render( 'editor', {
		title: "Create",
		metric: { options: {} },
	 });
});

router.get('/edit/:id', function( req, res, next ) {
	METRIC.findOne( {
		where: { metric_id: req.params.id },
	} ).then( function( metric ) {
		res.render('editor', {
			metric_id: metric.metric_id,
			title: "Edit Metric",
			metric: metric,
		});
	} );
});

function save_metric( req, res, next ) {
	var data = req.body;

	if ( data.id == null ) {
		METRIC.create( data ).then( function( metric ) {
			DEBUG( "Metric created", metric.metric_id );
			res.redirect( '/manage/edit/' + metric.metric_id );
		} );
	} else {
		metric_id = data.id;
		delete data.id;

		METRIC.update( data, {
			where: { metric_id: metric_id },
		} ).then( function( metric ) {
			DEBUG( "Metric updated", metric.metric_id );
			res.redirect( '/manage/edit/' + metric.metric_id );
		} );
	}
}

router.post( '/edit/:id', save_metric );
router.post( '/create', save_metric );

module.exports = router;
