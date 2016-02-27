
const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');
const TYPES = require('../metric-types');
const DEBUG = require('debug')('eval:database');

DEBUG("Metric types", Object.keys(TYPES));

module.exports = DATABASE.define( 'metric', {
	metric_id: {
		type: SEQUELIZE.UUID,
		defaultValue: SEQUELIZE.UUIDV4,
		primaryKey: true,
		allowNull: false,
	},
	name: {
		type: SEQUELIZE.STRING(64),
		allowNull: false,
	},
	type: {
		type: SEQUELIZE.ENUM(),
		values: Object.keys(TYPES), // TODO: If these values change it requires a database upgrade. Figure out some better way to make that work.
		get: function() {
			return TYPES[ this.getDataValue( 'type' ) ];
		},
		set: function( val ) {
			this.setDataValue( "type", val );
		},
	},
	options: {
		type: SEQUELIZE.TEXT,
		get: function() {
			return JSON.parse( this.getDataValue( 'options' ) );
		},
		set: function( val ) {
			val = this.type.validate_options( val );
			this.setDataValue( 'options', JSON.stringify( val ) );
		},
	},
} );
