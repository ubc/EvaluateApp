
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;
const WEEK   = 7 * DAY;

module.exports = {
	// This section provides general information about your server.
	site: {
		title: "Evaluate",
		description: "A simple service for providing ratings on any website",
		port: 3000, // The port on which to start the server.
		url: "http://localhost:3000", // This url should point to the root folder of your Evaluate installation.
	},

	// SSL settings
	ssl: false,
	/*
	ssl: {
		private_key: fs.readFileSync( __dirname + '/includes/certs/privatekey.pem' ),
		certificate: fs.readFileSync( __dirname + '/includes/certs/certificate.pem' ),
	},
	*/

	// This is the HTTP request logging mode.
	// See here for options https://github.com/expressjs/morgan#predefined-formats
	// Or set false to disable http logging.
	//http_logging: 'dev',
	http_logging: 'combined',

	// These are the configuration options for the database connection.
	database: {
		host: 'localhost',
		port: '3306',
		user: 'root',
		password: 'root',
		database: 'evaluate', // The database name that Evaluate will operate in.
		dialect: 'mysql', // One of the following dialects: mysql, mariadb, sqlite, postgres, mssql
	},

	// A list of API Keys that will be accepted by this server.
	// It is highly recommended that you use a UUID v4 for all your API Keys.
	// You can generate a UUID at this url, https://www.uuidgenerator.net/version4
	// API Keys should be kept secret.
	api_keys: [
		"4bfb4e2a-405d-4a85-872f-32764604f9cd", // Example key. Make sure you remove this!
	],

	// These are the configuration options for a Learning Record Store.
	// If you do not want an LRS, simple set this option to false.
	lrs: {
		url: "https://cloud.scorm.com/tc/CO2QZ8DR1Q/sandbox/",
		auth: {
			user: "P_NlxCkOx4_ouMxcQv4",
			password: "5UIRXbnEu8riMqT-eAU",
		},
	},
	
	// Configuration options for transactions.
	// Transactions are used to keep the system safe by only authorizing users to perform certain actions.
	// Be careful with how you set these values.
	// Note: all transactions are wiped on system restart.
	transactions: {
		// This is the number of times that a transaction is allowed to be renewed.
		// This setting can be configured for each path.
		// You shouldn't change any of these except for "/vote", unless you know what you are doing.
		renewal_limit: {
			"default":              0, // no renewals allowed by default
			"/vote":               10, // 10 renewals allowed for voting.
			"/embed":               0,
			"/metrics/edit":        0,
			"/metrics/save":       -1, // no limit on renewals for this path
			"/metrics/destroy":    -1,
			"/blueprints/edit":     0,
			"/blueprints/save":    -1,
			"/blueprints/destroy": -1,
		},
		// The amount of time that a user has to use their transaction before it expires.
		// This setting can be configured for each path.
		duration: {
			"default":              2 * MINUTE, // 2 minutes, unless otherwised specified.
			"/vote":               10 * MINUTE, // This means that if a user waits for more than 10 minutes without voting, they will have to reload the page.
			"/metrics/save":        1 * HOUR, // This means that a user can be editing a metric up to 1 hour without saving, before they lose their progress.
			"/metrics/destroy":     1 * HOUR,
			"/blueprints/save":     1 * HOUR,
			"/blueprints/destroy":  1 * HOUR,
		},
	}
};
