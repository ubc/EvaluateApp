
const DEBUG = require('debug')('eval:metrics');
const DEBUG_VOTE = require('debug')('eval:voting');
const UTIL = require('../util');
const DATABASE = require('../database');

function MetricType() {};

MetricType.prototype.log_vote = function( metric, new_vote, context_id, user_id, callback ) {
	var self = this;

	self.get_vote( metric, context_id, user_id, function( old_vote ) {
		DEBUG_VOTE("Got old vote", old_vote);
		new_vote = self._validate_vote( new_vote, old_vote, metric['options'] );

		if ( new_vote == null && old_vote == null ) {
			return;
		}

		DEBUG_VOTE("Got new vote", new_vote === null ? "null" : new_vote );
		self._save_vote( new_vote, old_vote, metric, context_id, user_id );
		
		self.get_score( metric, context_id, function( score ) {
			DEBUG_VOTE("Got score", score);
			score = self._adjust_score( score, new_vote, old_vote, metric['options'] );
			self._save_score( score, metric['metric_id'], context_id );

			callback( new_vote, score );
		} );
	} );
};

MetricType.prototype._validate_vote = function( new_vote, old_vote, options ) {
	new_vote = parseInt( new_vote );

	if ( isNaN( new_vote ) || new_vote == old_vote ) {
		return null;
	} else {
		return new_vote;
	}
};

MetricType.prototype._save_vote = function( new_vote, old_vote, metric, context_id, user_id ) {
	if ( new_vote === null ) {
		DATABASE.remove( DATABASE.tables.votes, {
			metric_id:  "HEX(" + DATABASE.escape( metric['metric_id'] ) + ")",
			context_id: DATABASE.escape( context_id ),
			user_id:    DATABASE.escape( user_id ),
		} );
	} else if ( old_vote === null ) {
		DATABASE.insert( DATABASE.tables.votes, {
			metric_id:  "HEX(" + DATABASE.escape( metric['metric_id'] ) + ")",
			context_id: DATABASE.escape( context_id ),
			user_id:    DATABASE.escape( user_id ),
			vote:       DATABASE.escape( new_vote ),
			modified:   'NOW()',
		} );
	} else {
		DATABASE.update( DATABASE.tables.votes, {
			vote:       DATABASE.escape( new_vote ),
			modified:   'NOW()',
		}, {
			metric_id:  "HEX(" + DATABASE.escape( metric['metric_id'] ) + ")",
			context_id: DATABASE.escape( context_id ),
			user_id:    DATABASE.escape( user_id ),
		} );
	}
};

MetricType.prototype._adjust_score = function( score, new_vote, old_vote, options ) {
	return score;
}

MetricType.prototype._save_score = function( score, metric_id, context_id ) {
	DATABASE.replace( DATABASE.tables.scores, {
		metric_id:  "HEX(" + DATABASE.escape( metric_id ) + ")",
		context_id: DATABASE.escape( context_id ),
		count:      DATABASE.escape( score['count'] ),
		sorting:    DATABASE.escape( score['sorting'] ),
		display:    DATABASE.escape( score['display'] ),
		average:    DATABASE.escape( score['average'] ),
		data:       DATABASE.escape( JSON.stringify( score['data'] ) ),
	} );
};

MetricType.prototype.get_vote = function( metric, context_id, user_id, callback ) {
	DATABASE.select( DATABASE.tables.votes, ['vote'], {
		metric_id:  "HEX(" + DATABASE.escape( metric['metric_id'] ) + ")",
		context_id: DATABASE.escape( context_id ),
		user_id:    DATABASE.escape( user_id ),
	}, function(results, fields) {
		if ( results.length > 0 ) {
			results = results[0].vote.readInt32BE(0, true);
		} else {
			results = null;
		}

		DEBUG("Got vote", results, "for", metric['metric_id'], "context:", context_id, "user:", user_id);
		callback(results);
	} );
};

MetricType.prototype.get_voting_data = function() {
	
};

MetricType.prototype.get_score = function( metric_id, context_id, callback ) {
	DATABASE.select( DATABASE.tables.scores, 'all', {
		metric_id:  "HEX(" + DATABASE.escape( metric_id ) + ")",
		context_id: DATABASE.escape( context_id ),
	}, function(results, fields) {
		if ( results.length > 0 ) {
			results = results[0];
			results['data'] = JSON.parse( results['data'] );
		} else {
			results = {
				count: 0,
				sorting: 0,
				display: 0,
				average: 0,
				data: {},
			};
		}

		callback(results);
	} );
};

MetricType.prototype.validate_options = function( options, valid_options ) {
	for ( var key in options ) {
		if ( validate_options.indexOf(key) == -1 ) {
			delete options[key];
		}
	}

	return options;
};

module.exports = MetricType;
