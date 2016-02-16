
jQuery( '.vote  *:input' ).change( function( event ) {
	event.stopImmediatePropagation();
	// Prevent default voting from working.
} );

jQuery( '.reset' ).click( function() {
	jQuery( 'form' )[0].reset();
} );

jQuery( 'form' ).submit( function( event ) {
	var new_vote = {};

	jQuery(this).children( '.submetric' ).each( function( index, submetric ) {
		var element = jQuery(submetric);
		var id = element.data('id');
		console.log("data", element.data());
		element.find( '.vote *:input' ).each( function( index, input ) {
			var value = extract_value( jQuery(input) );

			console.log("Testing", value, "for", id);
			if ( value != null ) {
				new_vote[ id ] = value;
			}
		} );
	} );

	console.log("Sending vote", new_vote);

	jQuery.post( "/api/vote", {
		transaction_id: data.transaction_id,
		vote: JSON.stringify( new_vote ),
	}, function( response ) {
		console.log( "Received", response, typeof response );

		for ( var i in response.vote ) {
			response_handler( {
				transaction_id: response.transaction_id,
				vote: response.vote[i],
				//score: response.score[i],
			}, new_vote, jQuery( '#submetric-' + i ) );
		}
	}, 'json' );

	event.preventDefault();
} );
