
const UUID = require('uuid4');
const CONFIG = require('../config');
const ADL = require('adl-xapiwrapper');
const DEBUG = require('debug')('eval:lrs');

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

		if ( user_id == null || context_id == null || metric_id == null ) {
			DEBUG("Missing Required Properties", "user_id:", user_id, "context_id:", context_id, "metric_id:", metric_id);
			return;
		}

		var score = data.score || {};
		var vote = data.vote || null;
		var verb = data.verb || this.verbs.RATED;
		var activity = data.activity || this.activities.LINK;
		var meta = data.meta || {};

		var statement = {
			id: UUID(),
			actor: {
				name: meta.username || "Unknown User",
				account: {
					homePage: meta.homeurl || "http://unknown",
					name: user_id,
				},
			},
			verb: verb,
			object: {
				id: context_id,
				definition: {
					type: activity,
					name: {
						"en-US": meta.activity_name || "Unknown Activity",
					},
					description: { 
						"en-US": meta.activity_description || "unknown",
					},
				},
			},
			result: {
				success: true,
				extensions: {}, // Defined in the next few lines.
			},
		};

		statement.result.extensions[ CONFIG.site.url + "/xapi/choice" ] = vote || "unknown";
		statement.result.extensions[ CONFIG.site.url + "/xapi/average" ] = score.average || 0;

		this.send( statement );
	},

	send: function( statement ) {
		if ( typeof lrs !== 'undefined' ) {
			lrs.sendStatements( statement, function( err, response, body ) {
				DEBUG( "Received", response.statusCode, body );
			})

			DEBUG( "Sent statement", statement );
		} // else there is no LRS configured, so we should silently fail.
	}
}
