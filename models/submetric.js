
const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');
const RUBRIC = require('./rubric');

module.exports = DATABASE.define( 'Submetric', {
	/*rubric: {
		type: SEQUELIZE.INTEGER(10),
		allowNull: false,
		reference: {
			model: RUBRIC,
			key: 'rubric_id',
		}
	},*/
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
		type: SEQUELIZE.BLOB,
		get: function() {
			return JSON.parse( this.getDataValue('options') );
		},
		set: function(val) {
			this.setDataValue( 'options', JSON.stringify( val ) );
		},
	},
}, {
	timestamps: false,
} );

module.exports.belongsTo( RUBRIC, {
	foreignKey: "rubric_id",
} );

module.exports.sync();
