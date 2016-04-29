
var Evaluate_Metric = {

	init: function() {
		// Radio button deselection functionality
		jQuery( 'input[type="radio"]' ).each( function() {
			var input = jQuery(this);
			input.data( 'previous', this.checked );
		} );

		jQuery( 'input[type="radio"]' ).on( 'click', Evaluate_Metric.on_radio_click );
		jQuery( '.vote  *:input' ).on( 'change', Evaluate_Metric.on_vote_change );

		// Prevent the no-JS fallback
		// TODO: Actually implement a no-JS fallback
		jQuery( '.vote a' ).click( function( event ) {
			event.preventDefault();
		} );

		console.log("Loaded metric.js");
	},

	on_radio_click: function() {
		var input = jQuery(this);

		if ( input.data( 'previous' ) == true ) {
			input.data( 'previous', false );
			input.attr( 'checked', false );
			input.change();
		} else {
			jQuery( 'input[name="'+input.attr('name')+'"]' ).data( 'previous', false );
			input.data( 'previous', true );
		}
	},

	on_vote_change: function() {
		var choice = Evaluate_Metric.extract_value( jQuery(this) );
		Evaluate_Metric.send_vote( choice );
	},

	extract_value: function( input ) {
		var tag = input.prop('tagName').toLowerCase();
		var type = input.attr('type')
		var result = null;

		if ( tag == 'input' ) {
			switch (type) {
				case 'checkbox':
					result = [];

					jQuery( "[name='" + input.prop('name') + "']" ).each( function( index, ele ) {
						var element = jQuery(ele);
						if ( element.prop('checked') == true ) {
							result.push( element.val() );
						}
					} );
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
		if ( data.transaction_id ) {
			console.log( "Sending vote", {
				transaction_id: data.transaction_id,
				vote: choice,
			}, "to /vote" );
			
			jQuery.post( "/vote/" + data.transaction_id, {
				vote: choice,
			}, function( response ) {
				console.log( "Received", response );
				if ( response.transaction_id != false ) {
					data.transaction_id = response.transaction_id;
					jQuery( '#metric' ).trigger( 'evaluate-update', [response, choice] );
				} else {
					// The next line warns the user that future votes will not work.
					// For the moment it's disabled. We'll tell the user when something actually goes wrong.
					//jQuery('#error-display').text( "Your transaction has reached it's renewal limit. Try refreshing the page." );
				}
			}, 'json' ).fail( function( error ) {
				console.log( error );
				jQuery('body').html( "<p id='error-display'>" + error.status + ": " + error.responseText + "</p>" );
			} );
		} else {
			jQuery('#error-display').text( "You do not have a valid transcation. Try refreshing the page." );
		}
	},
}

jQuery(document).ready( Evaluate_Metric.init );
