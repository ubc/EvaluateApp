
console.log('load');

jQuery(function() {
	jQuery('body').on('change', '.switch', function(event) {
		var element = jQuery(this);
		var anchor = element.data('anchor');
		var value = element.val();
		console.log('switching', anchor, 'to', value);

		jQuery(anchor).hide();

		if ( value != '' ) {
			jQuery(anchor+'.'+value).show();
		}
	});

	jQuery('form').submit(function() {
		jQuery( '.options:hidden *:input' ).prop( 'disabled', true );
	})
});
