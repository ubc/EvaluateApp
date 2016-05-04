/**
 * This file generates and manages transactions.
 * Transactions signify a short term authorization for a single action.
 * They can be generated in routes/index.js using the "/auth" route.
 */

const UUID = require('uuid4');
const UTIL = require('./util');
const CONFIG = require('../config');
const DEBUG = require('debug')('eval:security');

// A list to store our transactions.
var transaction_list = {};

/**
 * Creates a transaction
 * @param {string} action - The action which this transaction will authorize. This should be a valid route, as defined in the "routes" folder.
 * @param {array} data - Some data which will be made available when the transaction is redeemed. This should contain variables that the authorized action needs to execute.
 * @return {string} - The transaction UUID
 */
module.exports.create = function( action, data ) {
	// Generate an ID for the transaction.
	var id = UUID();

	// Get the configuration options for the duration and renewal limit of this transaction.
	var duration = CONFIG.transactions.duration['default'];
	var renewal_limit = CONFIG.transactions.renewal_limit['default'];

	if ( action in CONFIG.transactions.duration ) {
		duration = CONFIG.transactions.duration[action];
	}

	if ( action in CONFIG.transactions.renewal_limit ) {
		renewal_limit = CONFIG.transactions.renewal_limit[action];
	}

	// Define the transaction.
	transaction_list[id] = {
		action: action,
		data: data,
		expiration_time: new Date().getTime() + duration,
		renewal_limit: renewal_limit,
		used: false,
	};

	DEBUG( "Created transaction", id, transaction_list[id] );
	// Return the transaction UUID.
	return id;
}

/**
 * Renews an old transaction, with a new ID and expiration, but preserves the old data.
 * This is primarily a convenience function, so that you don't need to extract and recreate the old transaction.
 * However it also keeps track of renewal limits.
 * @param {string} id - The UUID of the transaction to be renewed.
 * @param {array} new_data - New data to add to the old data (or overwrite where necessary). See the transaction 'create' function for more details.
 */
module.exports.renew = function( id, new_data ) {
	// Check if the transaction exists.
	if ( id in transaction_list ) {
		// If so, extract it from the list.
		var transaction = transaction_list[id];
		delete transaction_list[id];

		// Check that the transaction
		if ( transaction.renewal_limit != 0 ) {
			// If new data has been defined, add it to the old data, overwriting where necessary.
			if ( new_data != null ) {
				transaction.data = UTIL.defaults( transaction.data, new_data );
			}

			// Create a new transaction using the old action and new data.
			var id = this.create( transaction.action, transaction.data );

			// Reduce the renewal limit of the new transaction.
			transaction_list[id].renewal_limit = transaction.renewal_limit - 1;
			
			// Return the transaction's UUID.
			return id;
		} else {
			DEBUG( "Transaction has reached it's renewal limit", id );
		}
	} else {
		DEBUG( "Transaction does not exist for renewal", id );
	}

	// Return false if the transaction could not be renewed.
	return false;
}

/**
 * Returns the data associated with a transaction and mark the transaction as used, so that it can't be reused.
 * @param {string} id - The UUID of the transaction to redeem.
 * @param {string} action - The action which we are redeeming for. This will be verified against the transaction's action, to make sure they match.
 */
module.exports.redeem = function( id, action ) {
	DEBUG( "Redeeming transaction", id, action );

	// Check that the transaction exists.
	if ( id in transaction_list ) {
		var transaction = transaction_list[id];

		// Check that the action matches.
		if ( transaction.action == action ) {
			// Check that the transaction has not expired.
			if ( transaction.expiration_time >= new Date().getTime() ) {
				// Check that the transaction has not been used.
				if ( transaction.used !== true ) {
					transaction.used = true;
					DEBUG( "Transaction successfully redeemed" );

					// Return the transaction data.
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

	// Return false if the transaction could not be redeemed.
	return false;
}

/**
 * Removes a transaction, if it has been used.
 * This function is used to clean up used transactions at the end of a request.
 * @param {string} id - The UUID of the transaction to clean up.
 */
module.exports.cleanup = function( id ) {
	if ( id in transaction_list && transaction_list[id].used === true ) {
		delete transaction_list[id];
	}
}
