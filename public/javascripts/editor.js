
jQuery(function() {
	jQuery('body').on('change', '.switch', function(event) {
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
	});

	jQuery('form').submit(function() {
		jQuery( '.options:hidden *:input' ).prop( 'disabled', true );
	})
});

console.log('Loaded editor.js');
