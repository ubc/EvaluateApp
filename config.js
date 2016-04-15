
module.exports = {
	database: {
		host: 'localhost',
		port: '3306',
		user: 'root',
		password: 'root',
		database: 'evaluate',
		dialect: 'mysql',
	},
	lti_consumers: [

	],
	lrs: {
		url: "https://lrs.adlnet.gov/xapi/",
		auth: {
			user: "tom",
			password: "1234",
		},
	},
};
