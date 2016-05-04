
/**
 * This file defines front-end javascript that makes voting work and other metric interactions work.
 */

var Evaluate_Metric = {

	init: function() {
		// This call creates the ability to deselect radio buttons by clicking on them again.
		// Many of the metrics are implemented using radio buttons, and need this functionality.
		jQuery( 'input[type="radio"]' ).on( 'click', Evaluate_Metric.on_radio_click );
		// Initialize the "previous" value for each radio button.
		jQuery( 'input[type="radio"]' ).each( function() {
			var input = jQuery(this);
			input.data( 'previous', this.checked );
		} );

		// Prevent the no-JS fallback
		// TODO: Actually implement a no-JS fallback
		jQuery( '.vote a' ).click( function( event ) {
			// Prevent the link from activating when you click on a vote.
			event.preventDefault();
		} );

		jQuery( '.vote  *:input' ).on( 'change', Evaluate_Metric.on_vote_change );

		console.log("Loaded metric.js");
	},

	/**
	 * Triggers when a radio button is clicked.
	 */
	on_radio_click: function() {
		var input = jQuery(this);

		if ( input.data( 'previous' ) == true ) {
			// If the button is already selected, deselect it.
			input.data( 'previous', false );
			input.attr( 'checked', false );
			// Trigger the change event, so that on_vote_change will be triggered.
			input.change();
		} else {
			// If the button is currently deselected, just update that the previously selected now is now deselected.
			jQuery( 'input[name="'+input.attr('name')+'"]' ).data( 'previous', false );
			// And record that the new one is now selected.
			input.data( 'previous', true );
		}
	},

	/**
	 * Triggers when a vote is changed
	 */
	on_vote_change: function() {
		// Extract the value of the input that has changed.
		var choice = Evaluate_Metric.extract_value( jQuery(this) );
		// Send this value off to the evaluate servers.
		Evaluate_Metric.send_vote( choice );
	},

	/**
	 * Extracts the currently selected choice from an input.
	 * This is simple for normal input boxes, but more complicated for radio and checkboxes.
	 */
	extract_value: function( input ) {
		var tag = input.prop('tagName').toLowerCase();
		var type = input.attr('type')
		var result = null;

		// Make sure that we are extracting from an input element.
		if ( tag == 'input' ) {
			// Switch for the different input types.
			switch ( type ) {
				case 'checkbox':
					//Loop through every checkbox with the same name, and get a list of checked values.
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
						// If the input is not checked, then break out, and return null.
						break;
					}
					// Otherwise, we should fall through to the default case.
				default:
					// Simply get the input value.
					result = input.val();
					break;
			}
		}

		console.log("extract value", tag, type, input.val(), result);
		return result;
	},

	/**
	 * Sends a vote to the server using the current transaction id.
	 */
	send_vote: function( choice ) {
		// data.transaction_id is defined in `views/metrics/single.jade`

		// Check that the transaction id is defined.
		if ( data.transaction_id ) {
			console.log( "Sending vote", {
				transaction_id: data.transaction_id,
				vote: choice,
			}, "to /vote" );
			
			// Send off the ajax request using the defined transaction_id.
			jQuery.post( "/vote/" + data.transaction_id, {
				vote: choice,
			}, function( response ) {
				console.log( "Received", response );
				if ( response.transaction_id != false ) {
					// If we received a valid transaction_id in the response, then save it.
					data.transaction_id = response.transaction_id;
				} else {
					// The next line warns the user that future votes will not work.
					// For now, it's disabled. We'll just tell the user when something actually goes wrong.
					//jQuery('#error-display').text( "Your transaction has reached it's renewal limit. Try refreshing the page." );
				}

				// Update the metric with the value we received from the response, just in case it differs from what we sent.
				// This will also update the displayed score.
				jQuery( '#metric' ).trigger( 'evaluate-update', [response, choice] );
			}, 'json' ).fail( function( error ) {
				// If the request fails then replace the screen with the error message.
				console.log( error );
				jQuery('body').html( "<p id='error-display'>" + error.status + ": " + error.responseText + "</p>" );
			} );
		} else {
			// Otherwise, let the user know that they don't have a valid transaction.
			jQuery('#error-display').text( "You do not have a valid transcation. Try refreshing the page." );
		}
	},
}

jQuery(document).ready( Evaluate_Metric.init );
