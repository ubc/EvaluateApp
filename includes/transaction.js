
const UUID = require('uuid4');
const DEBUG = require('debug')('eval:security');

var transaction_list = {}

module.exports.DURATION = {
	ONE_HOUR: 1000 * 60 * 60,
	ONE_DAY:  1000 * 60 * 60 * 24,
	ONE_WEEK: 1000 * 60 * 60 * 24 * 7,
};

module.exports.TYPE = {
	VOTE: "vote",
};

module.exports.create = function( args ) {
	var id = UUID();
	transaction_list[id] = {
		action: args.action,
		data: args.data,
		expiration_date: new Date().getTime() + args.duration,
		limit: args.limit,
	}

	DEBUG("Created transaction", id, transaction_list[id]);
	return id;
}

module.exports.data = function( id ) {
	if ( id in transaction_list ) {
		DEBUG( "Retrieving transaction", id, transaction_list[id].data );
		return transaction_list[id].data;
	} else {
		DEBUG( "No transaction", id );
		return false;
	}
}

module.exports.redeem = function( id, action ) {
	DEBUG( "Redeeming transaction", id, action );
	if ( id in transaction_list ) {
		var transaction = transaction_list[id];

		if ( transaction.action == action ) {
			if ( transaction.expiration_date >= new Date().getTime() ) {
				if ( transaction.limit > 1 ) {
					transaction.limit--;
					return transaction.data;
				} else if ( transaction.limit == 1 ) {
					delete transaction_list[id];
					return transaction.data;
				}
			} else {
				DEBUG( "Transaction is expired", transaction.expiration_date, "<", new Date().getTime() );
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
