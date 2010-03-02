;(function($) {

/**
 * Chainable helper method for to show modal form.
 *
 * @param options
 */
$.fn.modalform = function(options) {
    options = $.extend({
        formURL: "",
        formId: "",
        buttonId: "",
        overlayId: 'contact-overlay',
        containerId: 'contact-container',
    }, options);
    
    var frame = jQuery.FrameDialog
    .create({
        url: options.formURL,
        buttons:{},
        closeOnEscape: true,
        minWidth:800,
        minHeight:600,
        title: 'test title'
    });
    frame.find('iframe').attr('scrolling', 'no');
    return frame
    }
    
})(jQuery);