
/**
 * This module links together the various database modules with it's install function.
 */

const METRIC = require('./metric');
const SCORE = require('./score');
const VOTE = require('./vote');

const BLUEPRINT = require('./blueprint');
const SUBMETRIC = require('./submetric');

/**
 * Links and syncs the database tables.
 */
module.exports.install = function() {
	METRIC.hasMany( SCORE, {
		foreignKey: 'metric_id',
		onDelete: 'cascade',
	} );

	SCORE.belongsTo( METRIC, {
		foreignKey: 'metric_id',
	} );

	METRIC.hasMany( VOTE, {
		foreignKey: 'metric_id',
		onDelete: 'cascade',
	} );

	VOTE.belongsTo( METRIC, {
		foreignKey: 'metric_id',
	} );

	BLUEPRINT.hasMany( SUBMETRIC, {
		foreignKey: 'blueprint_id',
		onDelete: 'cascade',
	} );

	SUBMETRIC.belongsTo( BLUEPRINT, {
		foreignKey: 'blueprint_id',
	} );

	METRIC.sync().then( function() {
		SCORE.sync();
		VOTE.sync();
	} );

	BLUEPRINT.sync().then( function() {
		SUBMETRIC.sync();
	} );
};