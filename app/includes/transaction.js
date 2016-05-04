
const UUID = require('uuid4');
const UTIL = require('./util');
const CONFIG = require('../config');
const DEBUG = require('debug')('eval:security');

var transaction_list = {};

module.exports.create = function( action, data ) {
	var id = UUID();
	var duration = CONFIG.transactions.duration['default'];
	var renewal_limit = CONFIG.transactions.renewal_limit['default'];

	if ( action in CONFIG.transactions.duration ) {
		duration = CONFIG.transactions.duration[action];
	}

	if ( action in CONFIG.transactions.renewal_limit ) {
		renewal_limit = CONFIG.transactions.renewal_limit[action];
	}

	transaction_list[id] = {
		action: action,
		data: data,
		expiration_time: new Date().getTime() + duration,
		renewal_limit: renewal_limit,
		used: false,
	};

	DEBUG( "Created transaction", id, transaction_list[id] );
	return id;
}

module.exports.renew = function( id, new_data ) {
	if ( id in transaction_list ) {
		var transaction = transaction_list[id];
		delete transaction_list[id];

		if ( transaction.renewal_limit != 0 ) {
			if ( new_data != null ) {
				transaction.data = UTIL.defaults( transaction.data, new_data );
			}

			var id = this.create( transaction.action, transaction.data );
			transaction_list[id].renewal_limit = transaction.renewal_limit - 1;
			return id;
		} else {
			DEBUG( "Transaction has reached it's renewal limit", id );
		}
	} else {
		DEBUG( "Transaction does not exist for renewal", id );
	}

	return false;
}

module.exports.redeem = function( id, action ) {
	DEBUG( "Redeeming transaction", id, action );

	if ( id in transaction_list ) {
		var transaction = transaction_list[id];

		if ( transaction.action == action ) {
			if ( transaction.expiration_time >= new Date().getTime() ) {
				if ( transaction.used !== true ) {
					transaction.used = true;
					DEBUG( "Transaction successfully redeemed" );
					return transaction.data;
				} else {
					DEBUG( "Transaction has already been used" );
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
	if ( id in transaction_list && transaction_list[id].used === true ) {
		delete transaction_list[id];
	}
}
