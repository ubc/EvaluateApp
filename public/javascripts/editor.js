
var Evaluate_Editor = {

	init: function() {
		jQuery('body').on( 'change', '.switch', Evaluate_Editor.on_switch_change );
		jQuery('form').on( 'submit', Evaluate_Editor.on_form_submit );
		console.log('Loaded editor.js');
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

	on_form_submit: function() {
		jQuery( '.options:hidden *:input' ).prop( 'disabled', true );
	},
};

jQuery(document).ready( Evaluate_Editor.init );
