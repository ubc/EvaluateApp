
/**
 * This module defines the database table for the Blueprint object.
 * See here for details: http://docs.sequelizejs.com/en/latest/docs/models-definition/
 */

const SEQUELIZE = require('sequelize');
const DATABASE = require('../includes/database');

module.exports = DATABASE.define( 'blueprint', {
	blueprint_id: {
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
	api_key: {
		type: SEQUELIZE.UUID,
		allowNull: false,
	},
} );
