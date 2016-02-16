
const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');
const SUBMETRIC = require('../models/submetric');

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

module.exports.hasMany( SUBMETRIC, {
	foreignKey: "rubric_id",
} );

module.exports.sync();
