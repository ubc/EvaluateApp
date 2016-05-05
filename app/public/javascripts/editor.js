
/**
 * This file defines front-end javascript functions that make the blueprint/metric editors work.
 */

var Evaluate_Editor = {

	form: null,
	submit_button: null,
	delete_button: null,

	init: function() {
		Evaluate_Editor.form = jQuery('form');
		Evaluate_Editor.submit_button = jQuery('.submit-button');
		Evaluate_Editor.delete_button = jQuery('.delete-button');

		Evaluate_Editor.form.on( 'change', '.switch', Evaluate_Editor.on_switch_change );
		Evaluate_Editor.form.on( 'change', ':input', Evaluate_Editor.on_input_change );
		Evaluate_Editor.form.on( 'submit', Evaluate_Editor.on_form_submit );
		Evaluate_Editor.delete_button.on( 'click', Evaluate_Editor.on_delete );
		console.log('Loaded editor.js');
	},

	/**
	 * Triggers when any input changes.
	 */
	on_input_change: function() {
		// Enable the save button, since a change has been made.
		Evaluate_Editor.submit_button.removeClass( 'pure-button-disabled' );
		Evaluate_Editor.submit_button.prop( 'disabled', false );
		Evaluate_Editor.submit_button.val( "Save" );
	},

	/**
	 * Triggers when a ".switch" element is changed.
	 * Primarily this is when the "metric type" is changed.
	 * This function will then show and hide attached blocks as necessary.
	 */
	on_switch_change: function() {
		var element = jQuery(this);
		// Get the classname of elements that should be toggled.
		var anchor = element.data('anchor');
		// Check if this switch applies to siblings only.
		var siblings_only = element.data('siblings');
		// Get the new value of the switch.
		var value = element.val();

		console.log('switching', anchor, 'to', value, siblings_only ? "(siblings)" : "" );

		if ( siblings_only ) {
			// If set to siblings only then just search there.

			// Hide all target elements.
			element.siblings(anchor).hide();

			if ( value != '' ) {
				// Show the element which corresponds to our new value.
				element.siblings(anchor+'.'+value).show();
			}
		} else {
			// Hide all target elements.
			jQuery(anchor).hide();

			if ( value != '' ) {
				// Show the element which corresponds to our new value.
				jQuery(anchor+'.'+value).show();
			}
		}
	},

	/**
	 * Triggers when an editor form is submitted.
	 */
	on_form_submit: function( event ) {
		var submit_button = Evaluate_Editor.submit_button;
		var delete_button = Evaluate_Editor.delete_button;
		var form = Evaluate_Editor.form;

		// Change the save button to indicate that saving is in progress.
		submit_button.val("Saving...");
		submit_button.addClass( 'pure-button-disabled' );
		submit_button.prop( 'disabled', true );

		// Disable all hidden elements so that their data isn't captured.
		jQuery( '.options:hidden *:input' ).prop( 'disabled', true );

		// Send an ajax request with the data.
		jQuery.post( form.prop( 'action' ), form.serialize(), function( response, textStatus, xhr ) {
			console.log( "Received", response, typeof response );

			// Parse out the base path that this form uses for it's ajax request.
			var path = form.prop( 'action' );
			path = path.split("/");
			path.pop(); // Remove the transaction_id from the end.
			path.pop(); // Remove the "save" part of the path.
			path = path.join("/");

			switch ( xhr.status ) {
				case 200:
					// Save the path with the new transaction id.
					form.prop( 'action', path + "/save/" + response.save_transaction_id );
					// Refresh the preview, if there is one.
					if ( response.embed_transaction_id ) {
						jQuery( '#preview' ).prop( 'src', "/embed/" + response.embed_transaction_id );
					}
					// Set the save button to show that the values have been saved.
					submit_button.val("Saved");
					break;
				case 201:
					// Reload the page with a new editor.
					window.location.href = path + "/edit/" + response.edit_transaction_id;
					break;
				default:
					jQuery( '#error-display' ).text( response );
					break;
			}
		}, 'json' ).fail( function( error ) {
			// On a failure, reset the save button, showing that data still needs to be saved.
			submit_button.val("Save");
			submit_button.removeClass( 'pure-button-disabled' );
			submit_button.prop( 'disabled', false );

			// Display the error.
			console.log( error );
			jQuery( '#error-display' ).text( error.status + ": " + error.responseText );
		} );;

		// Re-enable the hidden attributes in case the user wants to continue editing.
		jQuery( '.options:hidden *:input' ).prop( 'disabled', false );

		// Prevent the form from submitting normally, since we are handling it with ajax.
		event.preventDefault();
	},

	/**
	 * Triggers when the delete button is pressed.
	 */
	on_delete: function( event ) {
		var delete_button = jQuery(this);
		var submit_button = Evaluate_Editor.submit_button;
		var form = Evaluate_Editor.form;

		if ( delete_button.hasClass('confirm') ) {
			// If the button already has the confirm class, then go ahead and delete.

			// Change the delete button to show that deleting is in progress.
			delete_button.removeClass('confirm');
			delete_button.text("Deleting...");

			// Send an ajax request to delete the object.
			jQuery.post( delete_button.prop( 'href' ), {}, function( response ) {
				console.log( "Received", response, typeof response );

				if ( response == "inprogress" ) {
					// This signals success, replace the entire screen with a message showing that the deletion was successful.
					jQuery('body').html("<p id='error-display'>This object, and the associated data has been deleted. Nothing can be recovered.</p>")
				} else {
					// An unexpected response, so just print it out.
					console.log( response );
					jQuery('#error-display').text( response );
				}
			} ).fail( function( error ) {
				console.log( error );
				jQuery('#error-display').text( error.status + ": " + error.responseText );
			} );
		} else {
			// If the button is not already in confirm mode, ask the user to confirm by clicking again.
			delete_button.addClass('confirm');
			delete_button.text("Are You Sure?");
		}

		event.preventDefault();
	},
};

jQuery(document).ready( Evaluate_Editor.init );
