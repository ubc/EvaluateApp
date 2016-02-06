
console.log("Starting script...");

var MYSQL = require('mysql');
var DATABASE = require('../includes/database');

/*if (process.argv.length < 6) {
	console.log("Insufficient arguments");
	process.exit();
}*/

var url = process.argv[2] || 'localhost:3306';
var user = process.argv[3] || 'root';
var password = process.argv[4] || 'root';
var database = process.argv[5] || 'evaluate';
var pending_queries = 0;

var connection = MYSQL.createConnection({
	url: url,
	user: user,
	password: password,
	//debug: true,
});

function start() {
	connection.connect();

	console.log("Installing database with name "+database);
	connection.query("CREATE DATABASE " + database, error_handler);
	connection.query("USE " + database, error_handler);

	create_tables();

	setInterval(function() {
		if ( pending_queries <= 0 ) {
			connection.end();
			process.exit();
		}
	}, 1000);
}

function create_tables() {
	
	create_table( DATABASE.tables.metrics, [
		"metric_id BINARY(16) NOT NULL", // insert/extract using HEX/UNHEX
		"name VARCHAR(64) NOT NULL",
		"type VARCHAR(10) NOT NULL",
		"options BLOB NOT NULL",
		"created TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00'",
		"modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
		"PRIMARY KEY (metric_id)",
	] );
	
	create_table( DATABASE.tables.rubric_fields, [
		"rubric_id INT(11) NOT NULL",
		"name VARCHAR(64) NOT NULL",
		"type VARCHAR(10) NOT NULL",
		"options BLOB NOT NULL",
		"PRIMARY KEY (rubric_id)",
	] );

	create_table( DATABASE.tables.rubrics, [
		"rubric_id INT(11) NOT NULL AUTO_INCREMENT",
		"name VARCHAR(64) NOT NULL",
		"description TINYTEXT",
		"PRIMARY KEY (rubric_id)",
	] );
	
	create_table( DATABASE.tables.votes, [
		"metric_id BINARY(16) NOT NULL", // insert/extract using HEX/UNHEX
		"context_id CHAR(32) NOT NULL",
		"user_id CHAR(32) NOT NULL",
		"vote TINYBLOB NOT NULL",
		"created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
		"modified TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00'",
		"PRIMARY KEY (metric_id, context_id, user_id)",
	] );
	
	create_table( DATABASE.tables.scores, [
		"metric_id BINARY(16) NOT NULL", // insert/extract using HEX/UNHEX
		"context_id CHAR(32) NOT NULL",
		"count INT(10) NOT NULL",
		"sorting FLOAT NOT NULL", // Used to sort the content
		"display FLOAT NOT NULL", // Value of the score which is displayed.
		"average FLOAT NOT NULL", // Arithmetic average of the votes. Must be reversible!
		"data BLOB NOT NULL",
		"PRIMARY KEY (metric_id, context_id)",
	] );
}

function create_table(table_name, fields) {
	var query = "CREATE TABLE " + table_name + " (\r\n" + fields.join(",\r\n") + "\r\n)";
	console.log(query, "\r\n");

	connection.query(query, function(err, result) {
		console.log("Query executed for", table_name);
		error_handler(err);
	});

	pending_queries++;
}

function error_handler(err) {
	pending_queries--;

	if (err) {
		if ( err.code == 'ER_TABLE_EXISTS_ERROR' || err.code == 'ER_DB_CREATE_EXISTS' ) {
			console.log(err.code);
		} else {
			console.log(err);
		}
	}
}

start();
