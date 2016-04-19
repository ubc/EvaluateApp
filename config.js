
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
	lti_consumers: {
		"testconsumerkey": "testconsumersecret",
	},
	lrs: {
		url: "https://lrs.adlnet.gov/xapi/",
		auth: {
			user: "tom",
			password: "1234",
		},
	},
};
