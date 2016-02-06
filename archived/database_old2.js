
const DEBUG = require('debug')('eval:database');
const MYSQL = require('mysql');

module.exports.tables = {
	metrics: 'metrics',
	scores: 'scores',
	votes: 'votes',
	rubrics: 'rubrics',
	rubric_fields: 'rubric_fields',
};

var database = process.env.DB_NAME || 'evaluate';
var connection;

function handle_error(err, query) {
	if (err) {
		DEBUG(err.code, err.message);
		DEBUG(query);
		throw err;
	}
}

module.exports.connect = function(args) {
	connection = MYSQL.createConnection({
		host: args.url,
		user: args.user,
		password: args.password,
		database: database,
	});
}

module.exports.escape = function(value, type) {
	if (type == "id") {
		return MYSQL.escapeId(value);
	} else {
		return MYSQL.escape(value);
	}
};

function where( args ) {
	var initial = true;
	var result = " WHERE ";
	var value;

	for (var key in args) {
		if (initial) {
			initial = false;
		} else {
			result += " AND ";
		}

		result += key;

		if ( args[key] instanceof Array ) {
			result += " IN (" + args[key].join(", ") + ")";
		} else {
			result += "=" + args[key];
		}
	}

	return result;
}

function join_map_values( map, sep ) {
	var initial = true;
	var result = "";

	for ( var key in map ) {
		if (initial) {
			initial = false;
		} else {
			result += sep;
		}

		result += map[key];
	}

	return result;
}

module.exports.select = function( table, columns, conditions, callback ) {
	var query = "SELECT ";

	if ( Array.isArray( columns ) ) {
		query += columns.join(", ");
	} else if ( columns == 'all' ) {
		query += '*';
	} else {
		DEBUG("Error!", "Tried to select with an unexpected type", typeof columns, columns);
	}

	query += " FROM " + table;

	if ( conditions instanceof Array ) {
		query += where(conditions);
	}
	
	connection.query(query, function(err, results) {
		handle_error(err, query);
		DEBUG("SELECTED", results);

		if (typeof callback !== 'undefined') {
			callback(results);
		}
	});
}

module.exports.insert = function( table, values, callback ) {
	var query = "INSERT INTO " + table;

	query += " (" + Object.keys(values).join(", ") + ")";
	query += " VALUES (" + join_map_values(values, ", ") + ")";

	DEBUG("INSERTING", table, "-", values);
	connection.query(query, function(err, result) {
		handle_error(err, query);
		if (typeof callback !== 'undefined') {
			callback(result.insertId);
		}
	});
}

module.exports.replace = function( table, values, callback ) {
	var query = "REPLACE INTO " + table;

	query += " (" + Object.keys(values).join(", ") + ")";
	query += " VALUES (" + join_map_values(values, ", ") + ")";

	DEBUG("REPLACING", table, "-", values);
	connection.query(query, function(err, result) {
		handle_error(err, query);
		if (typeof callback !== 'undefined') {
			callback(result.insertId);
		}
	});
}

module.exports.update = function( table, values, conditions, callback ) {
	var initial = true;
	var query = "UPDATE " + table;
	query += " SET";

	for (var key in values) {
		if (initial) {
			initial = false;
		} else {
			query += ",";
		}

		query += " " + key + "=" + values[key];
	}

	if ( conditions instanceof Array ) {
		query += where(conditions);
	}

	DEBUG("UPDATING", table, "-", values, "where", conditions);
	connection.query(query, function(err, result) {
		handle_error(err, query);
		if (typeof callback !== 'undefined') {
			callback();
		}
	});
}

module.exports.remove = function( table, conditions ) {
	var initial = true;
	var query = "DELETE FROM " + table;
	query += where(conditions);

	DEBUG( "REMOVING", table, "-", conditions );
	connection.query( query, function( err, result ) {
		handle_error( err, query);

		if ( typeof callback !== 'undefined' ) {
			callback( result.insertId );
		}
	} );
}

module.exports.disconnect = function() {
	connection.end( function(err) {
		handle_error( err, query );
		// The connection is terminated now.
	} );
}
