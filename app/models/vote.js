
const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');

module.exports = DATABASE.define( 'vote', {
	context_id: {
		type: SEQUELIZE.CHAR(255),
		allowNull: false,
	},
	user_id: {
		type: SEQUELIZE.CHAR(32),
		allowNull: false,
	},
	value: {
		type: SEQUELIZE.TEXT('tiny'),
		allowNull: false,
		get: function() {
			return JSON.parse( this.getDataValue('value') );
		},
		set: function(val) {
			this.setDataValue( 'value', JSON.stringify( val ) );
		},
	},
}, {
	indexes: [
		{
			unique: true,
			fields: ["metric_id", "context_id", "user_id"],
		}
	],
} );
