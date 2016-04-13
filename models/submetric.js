
const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');
const TYPES = require('../metric-types');

module.exports = DATABASE.define( 'submetric', {
	type: {
		type: SEQUELIZE.ENUM(),
		// TODO: Only include valid submetric types.
		values: Object.keys(TYPES), // TODO: If these values change it requires a database upgrade. Figure out some better way to make that work.
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
