
/**
 * This file defines front-end javascript functions that make the blueprint editor work.
 * It is designed to extend the existing `editor.js` file.
 */

var Evaluate_Editor_Blueprint = {

	// Holds the html element where submetrics are listed.
	submetric_list: null,
	// Holds a template for fresh submetrics.
	submetric_template: null,

	init: function() {
		submetric_list = jQuery('.submetric-list');
		submetric_template = jQuery('.submetric.empty').first().clone();

		submetric_list.on( 'change', 'select.switch', Evaluate_Editor_Blueprint.on_submetric_switch_change );
		jQuery('form').on( 'submit', Evaluate_Editor_Blueprint.on_form_submit );
		jQuery(document).ajaxComplete( Evaluate_Editor_Blueprint.on_form_submit_complete );
		console.log('Loaded editor-blueprint.js');
	},

	/**
	 * Triggers when a submetric '.switch' element changes. Namely the submetric type.
	 */
	on_submetric_switch_change: function() {
		var element = jQuery(this);
		var value = element.val();
		var submetric = element.closest('.submetric');

		if ( value == '' ) {
			// If the new type is empty, then remove this submetric.
			submetric.remove();
		} else if ( submetric.hasClass('empty') ) {
			// If this is a new submetric.
			submetric.removeClass('empty');

			// Change the text of the first switch element, to signal that switching back will delete this submetric.
			element.children().first().text("- Delete -");

			// Add a new submetric to the list.
			submetric_list.append( submetric_template.clone() );
		}
	},

	/**
	 * Triggers when the form is submitted.
	 * This function will then make sure that each submetric has the appropriate names.
	 */
	on_form_submit: function() {
		// Disable the hidden form elements so that they are not included in the form submission.
		jQuery( '.submetric.empty *:input' ).prop( 'disabled', true );

		// Loop through each submetric and assign the appropriate field names to it's inputs.
		jQuery( '.submetric' ).each( function( index, submetric ) {
			var element = jQuery(submetric);

			// Get all the inputs in this submetric.
			var inputs = element.find( '*:input:not(:disabled)' );

			if ( element.hasClass('empty') ) {
				// If the submetric is empty disable it's inputs, so that they are not included in the submission.
				inputs.prop( 'disabled', true );
			} else {
				// Loop through each input and set it's name.
				inputs.each( function( i, input ) {
					var element = jQuery(input);
					var name = element.data( 'raw-name' );

					// This block exists to preserve the original format of the name, for future form submissions.
					if ( ! name ) {
						// If the name has not already been preserved in data-raw-name
						name = element.prop( 'name' );
						// Then preserve it.
						element.data( 'raw-name', name );
					}

					var split = name.split( '[', 2 );

					// Each submetric input must start with submetric[#], which is what we are setting up here.
					if ( split.length == 2 ) {
						name = 'submetrics[' + index + '][' + split[0] + '][' + split[1];
					} else {
						name = 'submetrics[' + index + '][' + name + ']';
					}

					console.log("changed", element.prop( 'name' ), "to", name);
					// Save the name.
					element.prop( 'name', name );
				} );
			}
		} );
	},

	/**
	 * This triggers whenever an ajax request completes.
	 * We expect that that only occurs when a blueprint is saved or destroyed.
	 */
	on_form_submit_complete: function() {
		// Renable the empty inputs so that the user can continue editing
		jQuery( '.submetric.empty *:input' ).prop( 'disabled', false );
	}
};

jQuery(document).ready( Evaluate_Editor_Blueprint.init );
