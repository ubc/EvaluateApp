
const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');

module.exports = DATABASE.define( 'Rubric', {
	rubric_id: {
		type: SEQUELIZE.INTEGER(11),
		autoIncrement: true,
		primaryKey: true,
	},
	name: {
		type: SEQUELIZE.STRING(64),
		allowNull: false,
	},
	description: {
		type: SEQUELIZE.STRING,
	},
} );

module.exports.sync();
