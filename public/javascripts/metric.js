
function extract_value( input ) {
	var tag = input.prop('tagName').toLowerCase();
	var type = input.attr('type')
	var result;

	if ( tag != 'input' || ( ( type == 'checkbox' || type == 'radio' ) && ! input.prop('checked') ) ) {
		result = null;
	} else {
		result = input.val();
	}
	console.log("extract value", tag, type, input.val(), result);

	return result;
}

function response_handler( response, old_vote, root ) {
	console.log( "Received", response, typeof response );

	if ( typeof root === 'undefined' ) {
		root = jQuery('html');
	}

	if ( typeof response == "object" ) {
		root.find('.score').text( response.score );

		// Update to the new transaction id
		data.transaction_id = response.transaction_id;

		// TODO: Make this a lot more efficient.
		if ( response.vote != old_vote ) {
			root.find('input').not("[type='checkbox']").not("[type='radio']").val(response.vote);
			root.find('input[type="radio"][value="'+response.vote+'"]').prop( "checked", true );
			root.find('input[type="checkbox"][value="'+response.vote+'"]').prop( "checked", true );
		}
	} else {
		// TODO: Revert the changes if the nonce fails.
	}
}

jQuery( '.vote input[type="radio"]' ).click( function( event ) {
	var input = jQuery(this);

	if ( input.data('previous') == "true" ) {
		input.data( 'previous', 'false' );
		input.attr( 'checked', false );
		input.change();
	} else {
		jQuery('input[name="'+input.attr('name')+'"]').data( 'previous', 'false' );
		input.data( 'previous', 'true' );
	}
} );

jQuery( '.vote  *:input' ).change( function() {
	console.log("vote");
	var input = jQuery(this);
	var new_vote = extract_value(input);

	console.log( "Sending vote", {
		transaction_id: data.transaction_id,
		vote: new_vote,
	}, "to /api/vote" );
	
	jQuery.post( "/api/vote", {
		transaction_id: data.transaction_id,
		vote: new_vote,
	}, function( response ) {
		response_handler( response, new_vote );
	}, 'json' );
} );

// TODO: Actually implement the no-JS fallback
// Prevent the no-JS fallback.
jQuery( '.vote a' ).click( function( event ) {
	event.preventDefault();
} );

console.log("Loaded metrics.js");
