
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

// TODO: Implement limit checks.
module.exports.redeem = function( id, action ) {
	DEBUG( "Redeeming transaction", id, action );
	if ( id in transaction_list ) {
		var transaction = transaction_list[id];

		if ( transaction.action == action ) {
			// The transaction will either be redeemed or expired, so go ahead and delete it.
			delete transaction_list[id];

			if ( transaction.expiration_date >= new Date().getTime() ) {
				// TODO: Test transaction expiration.
				return transaction.data;
			}
		}
	}

	return false;
}
