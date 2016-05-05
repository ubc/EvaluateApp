
/**
 * This module defines the database table for the Metric object.
 * See here for details: http://docs.sequelizejs.com/en/latest/docs/models-definition/
 */

const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');
const TYPES = require('../metric-types');

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
		type: SEQUELIZE.STRING(19),
		validate: { isIn: [ TYPES ] },
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
	api_key: {
		type: SEQUELIZE.UUID,
		allowNull: false,
	},
} );
