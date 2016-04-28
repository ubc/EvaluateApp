
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;
const WEEK   = 7 * DAY;

module.exports = {
	site: {
		title: "Evaluate",
		description: "A simple service for providing ratings on any website",
		url: "http://localhost:3000"
	},
	database: {
		host: 'localhost',
		port: '3306',
		user: 'root',
		password: 'root',
		database: 'evaluate',
		dialect: 'mysql',
	},
	api_keys: [
		"4bfb4e2a-405d-4a85-872f-32764604f9cd", // Local test key.
	],
	lrs: {
		url: "https://cloud.scorm.com/tc/CO2QZ8DR1Q/sandbox/",
		auth: {
			user: "P_NlxCkOx4_ouMxcQv4",
			password: "5UIRXbnEu8riMqT-eAU",
		},
	},
	// Note: all transactions are wiped on system restart.
	transactions: {
		renewal_limit: {
			"default":              0, // no renewals allowed by default
			"/vote":               10,
			"/embed":               0,
			"/metrics/edit":        0,
			"/metrics/save":       -1, // no limit on renewals
			"/metrics/destroy":    -1,
			"/blueprints/edit":     0,
			"/blueprints/save":    -1,
			"/blueprints/destroy": -1,
		},
		duration: {
			"default":              2 * MINUTE,
			"/vote":               10 * MINUTE,
			"/metrics/save":        1 * HOUR,
			"/metrics/destroy":     1 * HOUR,
			"/blueprints/save":     1 * HOUR,
			"/blueprints/destroy":  1 * HOUR,
		},
	}
};
