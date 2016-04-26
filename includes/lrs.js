
const UUID = require('uuid4');
const CONFIG = require('../config');
const ADL = require('adl-xapiwrapper');
const DEBUG = require('debug')('eval:auth');

ADL.debugLevel = 'info';

if ( CONFIG.lrs ) {
	var lrs = new ADL.XAPIWrapper( CONFIG.lrs );
	DEBUG( "LRS configured", CONFIG.lrs );
} else {
	DEBUG( "LRS disabled", "No configuration provided." );
}

module.exports = {
	verbs: {
		RATED: {
			id: "http://id.tincanapi.com/verb/rated",
			display: {
				"en-US": "rated",
			}
		},
		ANSWERED: {
			id: "http://adlnet.gov/expapi/verbs/answered",
			display: {
				"en-US": "answered",
			}
		},
	},

	activities: {
		QUESTION: "http://adlnet.gov/expapi/activities/question",
		LINK: "http://adlnet.gov/expapi/activities/link",
		COMMENT: "http://activitystrea.ms/schema/1.0/comment",
	},

	send_vote: function( data ) {
		var user_id = data.user_id || null;
		var context_id = data.context_id || null;
		var metric_id = data.metric_id || null;
		var score = data.score || {};
		var vote = data.vote || null;
		var verb = data.verb || this.verbs.RATED;
		var activity = data.activity || this.activities.LINK;

		if ( user_id == null || context_id == null || metric_id == null ) {
			DEBUG("Missing Required Properties", "user_id:", user_id, "context_id:", context_id, "metric_id:", metric_id);
		}

		this.send( {
			id: UUID(),
			actor: {
				// TODO: Implement the user name.
				//name: "",
				account: {
					// TODO: Implement this home page.
					homePage: "http://localhost",
					name: user_id,
				},
			},
			verb: verb,
			object: {
				// TODO: Implement this as an absolute URL
				//id: context_id,
				id: "http://localhost",
				definition: {
					type: activity,
					// TODO: Implement the activity name.
					//name: "",
				},
			},
			result: {
				// TODO: Improve the information given here.
				success: true,
				/*score: {
				s	raw: vote,
				},*/
				extensions: {
					// TODO: Implement these extension urls.
					"http://localhost:3000/xapi/choice": vote,
					"http://localhost:3000/xapi/average": score.average || 0,
				},
			}
		} );
	},

	send: function( statement ) {
		if ( typeof lrs !== 'undefined' ) {
			lrs.sendStatements( statement, function( err, response, body ) {
				ADL.log( 'info', response.statusCode );
				ADL.log( 'info', body );
			})

			DEBUG( "Sent statement", statement );
		} // else there is no LRS configured, so we should silently fail.
	}
}
