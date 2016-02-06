
const UUID = require('uuid4');

var nonce_list = {}
// TODO: Add notion of nonce expiration

module.exports.create = function( key ) {
	nonce_list[key] = UUID();
	return nonce_list[key];
}

module.exports.check = function( key, nonce ) {
	return nonce_list[key] == nonce;
}

module.exports.expire = function( key ) {
	delete nonce_list[key];
}
