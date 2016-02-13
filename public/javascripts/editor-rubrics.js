
jQuery(function() {
	var submetric_list = jQuery('.submetric-list');
	var submetric_template = jQuery('.submetric.empty').first().clone();

	submetric_list.on( 'change', 'select.switch', function() {
		var element = jQuery(this);
		var value = element.val();
		var submetric = element.closest('.submetric');

		if ( value == '' ) {
			submetric.remove();
		} else if ( submetric.hasClass('empty') ) {
			submetric.removeClass('empty');
			element.children().first().text("- Delete -");
			submetric_list.append( submetric_template.clone() );
		}
	} )
});
