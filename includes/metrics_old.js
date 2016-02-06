
const DATABASE = require('./database');
const DEBUG = require('debug')('eval:metrics');
const DEBUG_VOTE = require('debug')('eval:voting');
const UUID = require('uuid4');
const METRIC_TYPES = {
	'one-way': require('./metric-types/one-way'),
};

module.exports = {

	get: function( ids, callback ) {
		var where = null;

		if ( ids != null ) {
			where = { metric_id: ids };
		}

		DATABASE.select(
			DATABASE.tables.metrics,
			'all',
			where,
			function(results) {
				for ( var index in results ) {
					results[index]['options'] = JSON.parse( results[index]['options'] );
				}

				callback(results);
			}
		);
	},

	save: function( args ) {
		var metric_id = args['metric_id'];
		var metric_type = METRIC_TYPES[ args['type'] ];
		var options = metric_type.validate_options( args['options'] );

		var data = {
			name: DATABASE.escape( args['name'] ),
			type: DATABASE.escape( args['type'] ),
			options: DATABASE.escape( JSON.stringify( options ) ),
		};

		DEBUG("Metric save", data);

		// TODO: Assert that name and type are not empty.

		if ( metric_id == null ) {
			metric_id = UUID().replace(/-/g, '');
			data['metric_id'] = "HEX(" + DATABASE.escape( metric_id ) + ")";
			data['created'] = "NOW()";

			DEBUG("Metric insert", data);
			DATABASE.insert( DATABASE.tables.metrics, data );
		} else {
			DEBUG("Metric update", data);
			DATABASE.update( DATABASE.tables.metrics, data, {
				metric_id: args['metric_id'],
			} );
		}

		return metric_id;
	},

	set_vote: function( metric, new_vote, context_id, user_id, callback ) {
		DEBUG_VOTE("Logging vote", "type:", metric['type'], "vote:", new_vote, "context_id:", context_id, "user_id:", user_id);
		METRIC_TYPES[ metric['type'] ].log_vote( metric, new_vote, context_id, user_id, callback );
	},

	get_vote: function( metric, context_id, user_id, callback ) {
		METRIC_TYPES[ metric['type'] ].get_vote( metric, context_id, user_id, callback );
	},

	get_score: function( metric, context_id, callback ) {
		METRIC_TYPES[ metric['type'] ].get_score( metric['metric_id'], context_id, callback );
	},

}