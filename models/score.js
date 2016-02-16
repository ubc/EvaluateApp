
const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');
const METRIC = require('./metric');
const DEBUG = require('debug')('eval:database');

module.exports = DATABASE.define( 'score', {
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
			var val = this.getDataValue('data');

			if ( val == null ) {
				return {};
			} else {
				return JSON.parse( val );
			}
		},
		set: function(val) {
			this.setDataValue( 'data', JSON.stringify( val ) );
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
