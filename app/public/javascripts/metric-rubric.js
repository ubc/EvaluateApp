
/**
 * This file defines front-end javascript that makes the special scenarios for the Rubric metric type work.
 * It is designed to build on the existings `metric.js` file.
 */

var Evaluate_Metric_Rubric = {

	init: function() {
		// Enable the reset button, which clears all votes.
		jQuery( '.reset' ).on( 'click', Evaluate_Metric_Rubric.reset_form );

		// Rubric votes are only submitted when the button is pressed. This makes that happen.
		jQuery( 'form' ).on( 'submit', Evaluate_Metric_Rubric.on_form_submit );

		// Prevent default voting from working.
		// Since a Rubric is composed of small metrics, we want to take over their vote handling. This disables that vote handling.
		jQuery( '.vote *:input' ).on( 'change', function( event ) {
			event.stopImmediatePropagation();
		} );

		console.log("Loaded metric-rubric.js");
	},

	/**
	 * Triggers when the reset button is pressed.
	 */
	reset_form: function() {
		// This will reset all inputs to their default.
		jQuery( 'form' )[0].reset();
	},

	/**
	 * Triggers when the rubric form is submitted.
	 */
	on_form_submit: function() {
		var choices = {};

		// Loop through each submetric.
		jQuery(this).children( '.submetric' ).each( function( index, submetric ) {
			var element = jQuery(submetric);
			var id = element.data('id'); // Get the submetric's id.

			// Loop through each input for the submetric.
			element.find( '.vote *:input' ).each( function( index, input ) {
				// Extract the submetric's value.
				var value = Evaluate_Metric.extract_value( jQuery(input) );

				if ( value != null ) {
					// If it is not null, add it to our listed
					choices[ id ] = value;
				}
			} );
		} );

		// Send off the vote.
		Evaluate_Metric.send_vote( JSON.stringify( choices ) );
		event.preventDefault();
	},
};

jQuery(document).ready( Evaluate_Metric_Rubric.init );
