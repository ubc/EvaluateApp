
const CONFIG = require('../config');
const SEQUELIZE = require('sequelize');

var args = CONFIG.database;

module.exports = new SEQUELIZE( args.database, args.user, args.password, {
	host: args.host,
	post: args.port,
	dialect: args.dialect,
	define: {
		timestamps: true,
		createdAt: 'created',
		updatedAt: 'modified',
	}
} );
