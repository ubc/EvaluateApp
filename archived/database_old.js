
var MYSQL = require('mysql');

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
		console.log(err.code, err.message);
		console.log(query)
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

function escape( data, type ) {
	return data;

	// TODO: Figure out the proper way to escape or validate these inputs.
	var result = type == 'map' ? {} : [];

	for (var key in data) {
		switch (type) {
			case 'identifiers':
				result[key] = MYSQL.escapeId(data[key]);
				break;
			case 'map':
				escaped_key = MYSQL.escapeId(key);
				result[escaped_key] = MYSQL.escape(data[key]);
				console.log('set', key, data[key], result[escaped_key]);
				break;
			default:
				result[key] = MYSQL.escape(data[key]);
				break;
		}
	}

	return result;
}

function where( args ) {
	var initial = true;
	var result = " WHERE";
	var value;

	for (var key in args) {
		if (initial) {
			initial = false;
		} else {
			result += " AND ";
		}

		if ( args[key] instanceof Array ) {
			value = " IN (" + escape(args[key]).join(", ") + ")";
		} else {
			value = "=" + MYSQL.escape(args[key]);
		}
		
		result += " " + key/*MYSQL.escapeId(key)*/ + value;
		// TODO: Figure out the proper way to escape these inputs.
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
		columns = escape(columns);
		query += columns.join(", ");
	} else if ( columns == 'all' ) {
		query += '*';
	} else {
		console.log("Error!", "Tried to select with an unexpected type", typeof columns, columns);
	}

	query += " FROM " + table;

	if ( conditions instanceof Array ) {
		query += where(conditions);
	}
	
	connection.query(query, function(err, results) {
		handle_error(err, query);
		console.log("SELECTED", results);

		if (typeof callback !== 'undefined') {
			callback(results);
		}
	});
}

module.exports.insert = function( table, values, callback ) {
	console.log("VALS0", values);
	values = escape(values, 'map');
	console.log("VALS1", values);

	var query = "INSERT INTO " + table;

	query += " (" + Object.keys(values).join(", ") + ")";
	query += " VALUES (" + join_map_values(values, ", ") + ")";
	console.log("VALS2", join_map_values(values, ", "));

	connection.query(query, function(err, result) {
		handle_error(err, query);
		if (typeof callback !== 'undefined') {
			callback(result.insertId);
		}
	});
}

module.exports.replace = function( table, values, callback ) {
	values = escape(values, 'map');

	var query = "REPLACE INTO " + table;

	query += " (" + Object.keys(values).join(", ") + ")";
	query += " VALUES (" + join_map_values(values, ", ") + ")";

	connection.query(query, function(err, result) {
		handle_error(err, query);
		if (typeof callback !== 'undefined') {
			callback(result.insertId);
		}
	});
}

module.exports.update = function( table, values, conditions, callback ) {
	values = escape(values, 'map');

	var query = "UPDATE " + table;
	query += " SET";

	for (var key in values) {
		if (initial) {
			initial = false;
		} else {
			query += ",";
		}

		query += " " + key + "=" + MYSQL.escape(where[key]);
	}

	if ( conditions instanceof Array ) {
		query += where(conditions);
	}

	connection.query(query, function(err, result) {
		handle_error(err, query);
		if (typeof callback !== 'undefined') {
			callback();
		}
	});
}

module.exports.remove = function( table, conditions ) {
	conditions = escape(conditions, 'map');

	var initial = true;
	var query = "DELETE FROM " + table;
	query += where(conditions);

	console.log("removing", conditions);
	connection.query(query, function(err, result) {
		handle_error(err, query);
		if (typeof callback !== 'undefined') {
			callback(result.insertId);
		}
	});
}

module.exports.disconnect = function() {
	connection.end(function(err) {
		handle_error(err, query);
		// The connection is terminated now.
	});
}
