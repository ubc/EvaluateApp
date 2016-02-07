
const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');
const TYPES = require('../metric-types');

module.exports = DATABASE.define( 'Metric', {
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
		type: SEQUELIZE.ENUM(), // TODO: Define this better.
		values: Object.keys(TYPES),
		// TODO: Implement get/set?
		get: function() {
			return TYPES[ this.getDataValue('type') ];
		}
	},
	options: {
		type: SEQUELIZE.TEXT,
		get: function() {
			return JSON.parse( this.getDataValue('options') );
		},
		set: function(val) {
			val = this.type.validate_options( val );
			this.setDataValue( 'options', JSON.stringify( val ) );
		},
	},
}/*, {
	classMethods: {

	},
	instanceMethods: {

	},
}*/ );

module.exports.sync();
