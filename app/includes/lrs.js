/**
 * This module handles communication with the Learning Record Store
 */

const UUID = require('uuid4');
const CONFIG = require('../config');
const ADL = require('adl-xapiwrapper');
const DEBUG = require('debug')('eval:lrs');

// Check if there exists a configuration for the LRS.
if ( CONFIG.lrs ) {
	// If so, initialize the LRS connector.
	var lrs = new ADL.XAPIWrapper( CONFIG.lrs );
	DEBUG( "LRS configured", CONFIG.lrs );
} else {
	DEBUG( "LRS disabled", "No configuration provided." );
}

// This module provides various utility functions for sending messages to the LRS.
module.exports = {
	// Predefine the verbs which are of use for our system.
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

	// Predefine the activities which are of interest to our system.
	activities: {
		QUESTION: "http://adlnet.gov/expapi/activities/question",
		LINK: "http://adlnet.gov/expapi/activities/link",
		COMMENT: "http://activitystrea.ms/schema/1.0/comment",
	},

	/**
	 * Sends a vote message to the LRS
	 * @param {array} data - parameters for the message. Expects user_id, context_id, metric_id, score, vote, verb, activity, and meta
	 */
	send_vote: function( data ) {
		var user_id = data.user_id || null;
		var context_id = data.context_id || null;
		var metric_id = data.metric_id || null;

		// Make sure that the required variables exist.
		if ( user_id == null || context_id == null || metric_id == null ) {
			DEBUG("Missing Required Properties", "user_id:", user_id, "context_id:", context_id, "metric_id:", metric_id);
			return;
		}

		// Extract variables.
		var score = data.score || {};
		var vote = data.vote || null;
		var verb = data.verb || this.verbs.RATED;
		var activity = data.activity || this.activities.LINK;
		var meta = data.meta || {};

		// Define the statement to send to the LRS.
		var statement = {
			id: UUID(), // Generate a UUID for our statement.
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

		// We define a couple extensions to the xAPI Spec for some variables that we want to send.
		statement.result.extensions[ CONFIG.site.url + "/xapi/choice" ] = vote || "unknown";
		statement.result.extensions[ CONFIG.site.url + "/xapi/average" ] = score.average || 0;

		// Send off the statement.
		this.send( statement );
	},

	/**
	 * Send a generic statement to the LRS
	 * @param {array} statement - The data to send.
	 */
	send: function( statement ) {
		if ( typeof lrs !== 'undefined' ) {
			// Send the statement
			lrs.sendStatements( statement, function( err, response, body ) {
				DEBUG( "Received", response.statusCode, body );
			})

			DEBUG( "Sent statement", statement );
		}
		// else there is no LRS configured, so we should silently fail.
	}
}
