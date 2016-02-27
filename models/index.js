
const METRIC = require('./metric');
const SCORE = require('./score');
const VOTE = require('./vote');

const RUBRIC = require('./rubric');
const SUBMETRIC = require('./submetric');

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

	RUBRIC.hasMany( SUBMETRIC, {
		foreignKey: "rubric_id",
		onDelete: 'cascade',
	} );

	SUBMETRIC.belongsTo( RUBRIC, {
		foreignKey: "rubric_id",
	} );

	METRIC.sync().then( function() {
		SCORE.sync();
		VOTE.sync();
	} );

	RUBRIC.sync().then( function() {
		SUBMETRIC.sync();
	} );
};