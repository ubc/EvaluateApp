
// TODO: Evaluate the quality of the javascript code.

var Evaluate = {
	init: function() {
		
		// Radio button deselection functionality
		jQuery( '.vote input[type="radio"]' ).each( function() {
			var input = jQuery(this);
			input.data( 'previous', this.checked );
		} );

		jQuery( '.vote input[type="radio"]' ).click( function( event ) {
			var input = jQuery(this);

			if ( input.data( 'previous' ) == "true" ) {
				input.data( 'previous', 'false' );
				input.attr( 'checked', false );
				input.change();
			} else {
				jQuery( 'input[name="'+input.attr('name')+'"]' ).data( 'previous', 'false' );
				input.data( 'previous', 'true' );
			}
		} );

		// Voting capture
		jQuery( '.vote  *:input' ).change( function() {
			console.log("vote");
			var choice = Evaluate.extract_value( jQuery(this) );
			Evaluate.send_vote( choice );
		} );

		// TODO: Actually implement the no-JS fallback
		// Prevent the no-JS fallback
		jQuery( '.vote a' ).click( function( event ) {
			event.preventDefault();
		} );

		// -----
		console.log("Loaded metrics.js");
	},

	extract_value: function( input ) {
		var tag = input.prop('tagName').toLowerCase();
		var type = input.attr('type')
		var result = null;

		if ( tag == 'input' ) {
			switch (type) {
				case 'checkbox':
					result = [];

					console.log("Checkbox gives", result);
					jQuery( "[name='" + input.prop('name') + "']" ).each( function( index, ele ) {
						var element = jQuery(ele);
						if ( element.prop('checked') == true ) {
							result.push(element.val())
						}
					} );
					console.log("Checkbox gives", result);
					break;
				case 'radio':
					if ( input.prop('checked') != true ) {
						break;
					}
				default:
					result = input.val();
					break;
			}
		}

		console.log("extract value", tag, type, input.val(), result);
		return result;
	},

	send_vote: function( choice ) {
		console.log( "Sending vote", {
			transaction_id: data.transaction_id,
			vote: choice,
		}, "to /api/vote" );
		
		jQuery.post( "/api/vote", {
			transaction_id: data.transaction_id,
			vote: choice,
		}, function( response ) {
			console.log( "Received", response, typeof response );

			if ( typeof response === 'object' ) {
				jQuery( '#metric' ).trigger( 'evaluate-update', [response, choice] );
			} else {
				// TODO: Give some indication that the page needs to be refreshed.
				console.log( response );
			}
		}, 'json' );
	},
}

jQuery(document).ready( Evaluate.init );
