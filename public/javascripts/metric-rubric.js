
// Enable the reset button
jQuery( '.reset' ).click( function() {
	jQuery( 'form' )[0].reset();
} );

// Prevent default voting from working.
jQuery( '.vote  *:input' ).change( function( event ) {
	event.stopImmediatePropagation();
} );

// Submit a vote
jQuery( 'form' ).submit( function( event ) {
	var choices = {};

	// Collect values from each submetric.
	jQuery(this).children( '.submetric' ).each( function( index, submetric ) {
		var element = jQuery(submetric);
		var id = element.data('id');

		// Loop through each input for the valid input.
		element.find( '.vote *:input' ).each( function( index, input ) {
			var value = extract_value( jQuery(input) );

			if ( value != null ) {
				choices[ id ] = value;
			}
		} );
	} );

	Evaluate.send_vote( choices );

	event.preventDefault();
} );
