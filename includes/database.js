
const SEQUELIZE = require('sequelize');

var args = {
	host: 'localhost',
	port: '3306',
	user: 'root',
	password: 'root',
	database: 'evaluate',
	dialect: 'mysql',
};

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
