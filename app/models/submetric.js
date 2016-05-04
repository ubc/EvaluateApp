
/**
 * This module defines the database table for the Submetric object.
 * See here for details: http://docs.sequelizejs.com/en/latest/docs/models-definition/
 */

const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');
const TYPES = require('../metric-types');

module.exports = DATABASE.define( 'submetric', {
	type: {
		type: SEQUELIZE.STRING(),
		validate: { isValidSubmetric: function( val ) {
			return val in TYPES && TYPES[ val ].valid_as_submetric;
		} },
		get: function() {
			return TYPES[ this.getDataValue( 'type' ) ];
		},
		set: function( val ) {
			this.setDataValue( "type", val );
		},
	},
	options: {
		type: SEQUELIZE.BLOB,
		get: function() {
			return JSON.parse( this.getDataValue('options') );
		},
		set: function(val) {
			this.setDataValue( 'options', JSON.stringify( val ) );
		},
	},
	weight: {
		type: SEQUELIZE.FLOAT,
	},
}, {
	timestamps: false,
} );
