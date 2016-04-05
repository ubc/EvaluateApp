
var Evaluate_Editor_Blueprint = {

	submetric_list: null,
	submetric_template: null,

	init: function() {
		submetric_list = jQuery('.submetric-list');
		submetric_template = jQuery('.submetric.empty').first().clone();

		submetric_list.on( 'change', 'select.switch', Evaluate_Editor_Blueprint.on_switch_change );
		jQuery('form').on( 'submit', Evaluate_Editor_Blueprint.on_form_submit );
		console.log('Loaded editor-blueprint.js');
	},

	on_switch_change: function() {
		console.log("on_switch_change");
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
	},

	on_form_submit: function() {
		jQuery( '.submetric.empty *:input' ).prop( 'disabled', true );

		jQuery( '.submetric' ).each( function( index, submetric ) {
			var element = jQuery(submetric);
			var inputs = element.find( '*:input:not(:disabled)' );

			if ( element.hasClass('empty') ) {
				inputs.prop( 'disabled', true );
			} else {
				inputs.each( function( i, input ) {
					var element = jQuery(input);
					var name = element.prop( 'name' );
					var split = name.split( '[', 2 );

					if ( split.length == 2 ) {
						name = 'submetrics[' + index + '][' + split[0] + '][' + split[1];
					} else {
						name = 'submetrics[' + index + '][' + name + ']';
					}

					console.log("changed", element.prop( 'name' ), "to", name);
					element.prop( 'name', name );
				} );
			}
		} );
	},
};

jQuery(document).ready( Evaluate_Editor_Blueprint.init );
