/*
* jQuery Frame Dialog 0.6
*
* Copyright (c) 2009 SolutionStream.com & Michael J. Ryan (http://www.solutionstream.com/)
* Dual licensed under the MIT (MIT-LICENSE.txt)
* and GPL (GPL-LICENSE.txt) licenses.
* 
* Requires:
*	jquery ui dialog
*
*	jQuery.FrameDialog namespaced
*		.create()	function will create an iframe, pass on the options 
*					and return from a jQueryUI Dialog.
*					additional url option
*
*	TODO:	- Add logic to allow for relative URLs.
*
*	CUSTOMIZATION:
*		see FrameDialog._defaultOptions below for additional changes from ui dialog defaults
*		Returns a jQuery.dialog extension, with the same options passed in.
*
*		refer to jQueryUI Dialog for more customization options
*
*
*	LOCALIZATION: create a window.localization object
*				localization.OK			override text for the OK button
*				localization.Cancel		override text for the Cancel button
*
*
*	FROM PARENT WINDOW: use the full url, including protocol://host/ portions
*				jQuery.FrameDialog
*					.create({
*						url: baseURL + 'framed-modal-test.aspx',
*						title: 'test title',
*						... Other jQueryUI Dialog Options ...
*					})
*					.bind('dialogclose', function(event, ui) {
*						alert("result: " + event.result);
*					});
*
*	INSIDE MODAL:
*				jQuery.FrameDialog.setResult(value);	//sets the result value
*				jQuery.FrameDialog.clearResult();		//clears the result value
*				jQuery.FrameDialog.closeDialog();		//close the dialog (same as OK)
*				jQuery.FrameDialog.cancelDialog();		//cancel the dialot (same as Cancel
*
*
*
*	!!!!!!!!!! WARNING WARNING WARNING WARNING !!!!!!!!!!
*	Modal must set the result from the same host address in order to access 
*	the parent for setting the result.
*/
(function($) {

	//create FrameDialog namespace
	$.FrameDialog = $.FrameDialog || {};

	//array for return values, placeholder
	$.FrameDialog._results = $.FrameDialog._results || {};

	//default options
	$.FrameDialog._defaultOptions = {
		modal: true,
		closeOnEscape: false,
		position: 'center',
		buttons: {
			OK: function() {
				$(this).dialog("close");
			},
			CANCEL: function() {
				var frame = $(this);
				$.FrameDialog.clearResult(frame.attr("id"));
				frame.dialog("close");
			}
		}
	}


	$.FrameDialog.create = function(options) {
		//generate unique id
		var uid = Math.random().toString(16).replace(".", "") + (new Date()).valueOf().toString(16);

		//set localized variables
		var OK = (window.localization && window.localization.OK) || "OK";
		var Cancel = (window.localization && window.localization.CANCEL) || "Cancel";

		//extend frame dialog options with passed in options.
		var opts = $.extend(
			$.FrameDialog._defaultOptions,
			options || {}
		)

		var url = (opts && opts.url) || null;
		if (url === null)
			return alert("MODAL ERROR: Option 'url' not specified!"); //diagnostic error

		//clean up redundant forward slashes in the url.
		url = url.replace(/(^|[^:])\/+/g, "$1/");

		//remove url argument from options to be passed to dialog.
		try {
			delete opts.url;
		} catch (err) { }

		//create iframe object
		//	object type="text/html doesn't seem to work in IE :(
		//	using iframe, which seems to work cross browser, tested in IE7, and Firefox 3.0.7
		var iframe = $("<iframe />")
			.attr("id", uid + "-VIEW")
			.attr("name", uid + "-VIEW")
			.attr("src", url)
			.css("margin", "0")
			.css("border", "0")
			.css("padding", "0")
			.css("top", "0")
			.css("left", "0")
			.css("right", "0")
			.css("bottom", "0")
			.css("width", "100%")
			.css("height", "100%");

		var ret = $("<div />")
			.attr("id", uid)
			.css("margin", "0")
			.css("border", "0")
			.css("padding", "0")
			.css("top", "0")
			.css("left", "0")
			.css("right", "0")
			.css("bottom", "0")
			.hide()
			.append(iframe)
			.appendTo("body")
			.dialog(opts)
			.bind("dialogbeforeclose", function(event, ui) {
				var frame = $(this);
				var uid = frame.attr("id");

				//default close (firefox) - clear response
				if (event && event.originalTarget && event.originalTarget.nodeName && event.originalTarget.nodeName == "SPAN")
					$.FrameDialog.clearResult(uid);

				//default close (IE7) - clear response
				if (event && event.originalEvent && event.originalEvent.currentTarget && event.originalEvent.currentTarget.tagName && event.originalEvent.currentTarget.tagName == "A")
					$.FrameDialog.clearResult(uid);

				//get the response value, attach to the object.
				var result = $.FrameDialog._results[uid] || null; //result or an explicit null

				return result;
			})
			.bind('dialogclose', function(event, ui) {
				var frame = $(this);
				var uid = frame.attr("id");
				var result = $.FrameDialog._results[uid] || null; //result or an explicit null
				frame.attr("result", result);

				//Cleanup remnants in 15 seconds
				//		Should be enough time for the results of the close to finish up.
				window.setTimeout(
					function() {
						//cleanup the dialog
						frame.dialog('destroy')

						//destroy the iframe, remove from the DOM
						frame.remove();

						//remove the placeholder for the result
						try {
							delete $.FrameDialog._results[uid];
						} catch (err) { /*nothing to delete*/ }
					},
					15000
				);

				return result;
			});

/*** BEGIN FIX FOR jQueryUI 1.7 Dialog's sizing bug *************************************************/
					//store the window width at the start
					var winw = $(document).width();
					var wrap = ret.parent(".ui-resizable")
					var wrapresize = function() {
						iframe	.css('height', ret.height() + 'px')
								.css('width', ret.width() + 'px');
					}
					
					//set the window to the appropriate size - fix bug with jQueryUI's Dialog
					wrap
						.css('width', opts.minWidth + 'px')
						.css('height', opts.minHeight + 'px')
						.bind('resize', wrapresize);
					
					//set to unbind the resize event on close, prevent leaking
					ret.bind('dialogclose', function(event, ui) {
						wrap.unbind('resize', wrapresize);
					});
					
					//force resize event.
					wrap.trigger('resize');
						
					//get window's new width
					var ww = wrap.width();
					
					//reset the center position, if needed
					if (opts.position == 'center' || opts[0] == 'center' || opts[1] == 'center') {
						var pos = parseInt(parseFloat(winw - ww)/2);
						if (pos < 0) pos = 0;
					
						wrap.css('left', pos + 'px');
					}
					
					//reset right position, as needed
					if (opts.position == 'right' || opts[0] == 'right' || opts[1] == 'right') {
						var pos = winw - ww - 5; //set to rightmost, - 5 px
						if (pos < 0) pos = 0;
					
						wrap.css('left', pos + 'px');
					}
					
					
					
/*** END FIX FOR jQueryUI 1.7 Dialog's sizing bug *************************************************/
		
		return ret;
	}

	//retrieves the uid for the current frame within the parent.
	$.FrameDialog._getUid = function() {
		//find the current frame within the parent window
		if (window.parent && window.parent.frames && window.parent.document && window.parent.document.getElementsByTagName) {
			var iframes = window.parent.document.getElementsByTagName("IFRAME");
			for (var i = 0; i < iframes.length; i++) {
				var id = iframes[i].id || iframes[i].name || "";
				if (window.parent.frames[id] == window) {
					return id.replace("-VIEW", "");
				}
			}
		}
		return null; //no match
	}

	//clear the result value
	//	uid - id for child window, or empty for current in parent.
	$.FrameDialog.clearResult = function(uid) {
		if (uid) {
			//clear child's value
			try {
				delete $.FrameDialog._results[uid];
			} catch (err) { /*nothing to delete*/ }
		} else {
			//clear for current dialog
			var uid = $.FrameDialog._getUid();

			if (uid != null && window.parent && window.parent.jQuery && window.parent.jQuery.FrameDialog && window.parent.jQuery.FrameDialog._results) {
				try {
					delete window.parent.jQuery.FrameDialog._results[uid];
				} catch (err) { /*nothing to delete*/ }
			}
		}
	}

	//helper function to set response value	to the parent
	//	value - result value for the given FrameDialog
	//	uid - child id, or empty for current FrameDialog
	$.FrameDialog.setResult = function(value, uid) {
		if (uid) {
			//set child value
			jQuery.FrameDialog._results[uid] = value;
		} else {
			//set value from inside
			var uid = $.FrameDialog._getUid();

			if (uid != null && window.parent && window.parent.jQuery && window.parent.jQuery.FrameDialog && window.parent.jQuery.FrameDialog._results) {
				window.parent.jQuery.FrameDialog._results[uid] = value;
			}
		}
	}

	//same as clicking OK button
	//	uuid - for a child node, or empty for current
	$.FrameDialog.closeDialog = function(uid) {
		if (uid) {
			//close child
			jQuery("#" + uid).dialog('close');
		} else {
			//close self			
			var uid = $.FrameDialog._getUid();
			if (uid != null && window.parent && window.parent.jQuery) {
				window.parent.jQuery("#" + uid).dialog('close');
			}
		}

		return false;
	}

	//same as clicking Cancel button
	//	uid - for a child node, or empty for current frame
	$.FrameDialog.cancelDialog = function(uid) {
		$.FrameDialog.clearResult(uid);
		$.FrameDialog.closeDialog(uid);
		return false;
	}

})(jQuery);
