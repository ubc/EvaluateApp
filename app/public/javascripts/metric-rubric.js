
var Evaluate_Metric_Rubric = {

	init: function() {
		// Enable the reset button
		jQuery( '.reset' ).on( 'click', Evaluate_Metric_Rubric.reset_form );

		// Submit a vote
		jQuery( 'form' ).on( 'submit', Evaluate_Metric_Rubric.on_form_submit );

		// Prevent default voting from working.
		jQuery( '.vote *:input' ).on( 'change', function( event ) {
			event.stopImmediatePropagation();
		} );

		console.log("Loaded metric-rubric.js");
	},

	reset_form: function() {
		console.log("reset_form");
		jQuery( 'form' )[0].reset();
	},

	on_form_submit: function() {
		console.log("on_form_submit");
		var choices = {};

		// Collect values from each submetric.
		jQuery(this).children( '.submetric' ).each( function( index, submetric ) {
			var element = jQuery(submetric);
			var id = element.data('id');

			// Loop through each input for the valid input.
			element.find( '.vote *:input' ).each( function( index, input ) {
				var value = Evaluate_Metric.extract_value( jQuery(input) );

				if ( value != null ) {
					choices[ id ] = value;
				}
			} );
		} );

		Evaluate_Metric.send_vote( JSON.stringify( choices ) );
		event.preventDefault();
	},
};

jQuery(document).ready( Evaluate_Metric_Rubric.init );
