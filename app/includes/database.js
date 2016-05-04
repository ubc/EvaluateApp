/**
 * This module initializes the Database, and provides access to the Sequelize instance.
 */

const CONFIG = require('../config');
const SEQUELIZE = require('sequelize');
const DEBUG = require('debug')('eval:database');

// Retrieve cofiguration data.
var args = CONFIG.database;

// Initialize the database connection.
module.exports = new SEQUELIZE( args.database, args.user, args.password, {
	host: args.host,
	post: args.port,
	dialect: args.dialect,
	define: {
		timestamps: true,
		createdAt: 'created',
		updatedAt: 'modified',
	},
	logging: DEBUG,
	syncOnAssociation: false,
} );
