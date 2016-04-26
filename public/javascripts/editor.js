
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

	on_input_change: function() {
		Evaluate_Editor.submit_button.removeClass( 'pure-button-disabled' );
		Evaluate_Editor.submit_button.prop( 'disabled', false );
		Evaluate_Editor.submit_button.val( "Save" );
	},

	on_switch_change: function() {
		var element = jQuery(this);
		var anchor = element.data('anchor');
		var siblings_only = element.data('siblings');
		var value = element.val();
		console.log('switching', anchor, 'to', value, siblings_only ? "(siblings)" : "" );

		if ( siblings_only ) {
			element.siblings(anchor).hide();

			if ( value != '' ) {
				element.siblings(anchor+'.'+value).show();
			}
		} else {
			jQuery(anchor).hide();

			if ( value != '' ) {
				jQuery(anchor+'.'+value).show();
			}
		}
	},

	on_form_submit: function( event ) {
		var submit_button = Evaluate_Editor.submit_button;
		var delete_button = Evaluate_Editor.delete_button;
		var form = Evaluate_Editor.form;

		submit_button.val("Saving...");
		submit_button.addClass( 'pure-button-disabled' );
		submit_button.prop( 'disabled', true );

		jQuery( '.options:hidden *:input' ).prop( 'disabled', true );

		console.log( "Submitting form to", form.prop( 'action' ) );
		jQuery.post( form.prop( 'action' ), form.serialize(), function( response ) {
			console.log( "Received", response, typeof response );

			if ( typeof response === 'object' ) {
				var path = form.prop( 'action' );
				path = path.split("/");
				path.pop();
				path = path.join("/");

				submit_button.val("Saved");
				form.prop( 'action', path + "/" + response.transaction_id );
			} else {
				submit_button.val("Save");
				submit_button.removeClass( 'pure-button-disabled' );
				submit_button.prop( 'disabled', false );
				// TODO: Give some indication that the page needs to be refreshed.
				console.log( response );
			}
		}, 'json' );

		jQuery( '.options:hidden *:input' ).prop( 'disabled', false );
		event.preventDefault();
	},

	on_delete: function( event ) {
		var delete_button = jQuery(this);
		var submit_button = Evaluate_Editor.submit_button;
		var form = Evaluate_Editor.form;

		if ( delete_button.hasClass('confirm') ) {
			delete_button.removeClass('confirm');
			delete_button.text("Deleting...");

			jQuery.post( delete_button.prop( 'href' ), {}, function( response ) {
				console.log( "Received", response, typeof response );

				if ( response == "success" ) {
					jQuery('body').html("<p>This object, and the associated data has been deleted. Nothing can be recovered.</p>")
				} else {
					// TODO: Give some indication that the page needs to be refreshed.
					console.log( response );
				}
			} );
		} else {
			delete_button.addClass('confirm');
			delete_button.text("Are You Sure?");
		}

		event.preventDefault();
	},
};

jQuery(document).ready( Evaluate_Editor.init );
