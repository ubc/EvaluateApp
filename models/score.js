
const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');
const METRIC = require('./metric');

module.exports = DATABASE.define( 'Score', {
	/*metric: {
		type: SEQUELIZE.UUID,
		allowNull: false,
		reference: {
			model: METRIC,
			key: 'metric_id',
		}
	},*/
	context_id: {
		type: SEQUELIZE.CHAR(32),
		allowNull: false,
	},
	count: {
		type: SEQUELIZE.INTEGER(10),
		allowNull: false,
		defaultValue: 0,
	},
	sorting: {
		type: SEQUELIZE.FLOAT,
		allowNull: false,
		defaultValue: 0,
	},
	display: {
		type: SEQUELIZE.FLOAT,
		allowNull: false,
		defaultValue: 0,
	},
	average: {
		type: SEQUELIZE.DECIMAL,
		allowNull: false,
		defaultValue: 0,
	},
	data: {
		type: SEQUELIZE.TEXT,
		get: function() {
			return JSON.parse( this.getDataValue('options') );
		},
		set: function(val) {
			this.setDataValue( 'options', JSON.stringify( val ) );
		},
	},
}, {
	indexes: [
		{
			unique: true,
			fields: ["metric_id", "context_id"],
		}
	]
} );

module.exports.belongsTo( METRIC, {
	foreignKey: "metric_id",
} );

module.exports.sync();
