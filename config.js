
module.exports = {
	site: {
		title: "Evaluate",
		description: "A simple service for providing ratings on any website",
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
	lti_consumers: {
		"testconsumerkey": "testconsumersecret",
	},
	lrs: {
		url: "https://cloud.scorm.com/tc/CO2QZ8DR1Q/sandbox/",
		auth: {
			user: "P_NlxCkOx4_ouMxcQv4",
			password: "5UIRXbnEu8riMqT-eAU",
		},
	},
};
