
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
	var input = jQuery(this);
	var new_vote = extract_value(input);

	console.log( "Sending vote", {
		transaction_id: data.transaction_id,
		vote: new_vote,
	}, "to", data.vote_url );
	
	jQuery.post( data.vote_url, {
		transaction_id: data.transaction_id,
		vote: new_vote,
	}, function( response ) {
		console.log( "Received", response );
		jQuery('.score').text( response.score );

		// TODO: Make this a lot more efficient.
		if ( response.vote != new_vote ) {
			jQuery('input').not("[type!='checkbox']").not("[type!='radio']").val(response.vote);
			jQuery('input[type="radio"][value="'+response.vote+'"]').prop( "checked", true );
			jQuery('input[type="checkbox"][value="'+response.vote+'"]').prop( "checked", true );
		}

		// TODO: Expand this to work for rubrics.
	}, 'json' );
} );

// TODO: Actually implement the no-JS fallback
// Prevent the no-JS fallback.
jQuery( '.vote a' ).click( function( event ) {
	event.preventDefault();
} );
