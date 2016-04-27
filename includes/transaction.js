
const UUID = require('uuid4');
const UTIL = require('./util');
const CONFIG = require('../config');
const DEBUG = require('debug')('eval:security');

var transaction_list = {};

module.exports.create = function( action, data ) {
	var id = UUID();
	var duration = CONFIG.transactions.duration['default'];

	if ( action in CONFIG.transactions.duration ) {
		duration = transaction_durations[action];
	}

	transaction_list[id] = {
		action: action,
		data: data,
		expiration_time: new Date().getTime() + duration,
		limit: 1,
	};

	DEBUG("Created transaction", id, transaction_list[id]);
	return id;
}

module.exports.renew = function( id, new_data ) {
	if ( id in transaction_list ) {
		var transaction = transaction_list[id];
		delete transaction_list[id];

		if ( new_data != null ) {
			transaction.data = UTIL.defaults( transaction.data, new_data );
		}

		return this.create( transaction.action, transaction.data );
	} else {
		DEBUG( "Transaction does not exist for renewal", id );
	}
}

module.exports.redeem = function( id, action ) {
	DEBUG( "Redeeming transaction", id, action );
	if ( id in transaction_list ) {
		var transaction = transaction_list[id];

		if ( transaction.action == action ) {
			if ( transaction.expiration_time >= new Date().getTime() ) {
				if ( transaction.limit > 0 ) {
					transaction.limit--;
					return transaction.data;
				} else {
					DEBUG( "Transaction has no more uses" );
				}
			} else {
				DEBUG( "Transaction is expired", transaction.expiration_time, "<", new Date().getTime() );
			}

			// If we haven't already returned data then the transaction is no longer valid, delete it.
			delete transaction_list[id];
		} else {
			DEBUG( "Transaction action does not match", transaction.action, action );
		}
	} else {
		DEBUG( "Transaction does not exist", id );
	}

	return false;
}

module.exports.cleanup = function( id ) {
	if ( id in transaction_list && transaction_list[id].limit < 1 ) {
		delete transaction_list[id];
	}
}
