(jQuery && jQuery.fn.upload) || (function( $) {
		// abort if xhr progress is not supported
	if( !($.support.ajaxProgress = ("onprogress" in $.ajaxSettings.xhr()))) {
		return;
	}

	var _ajax = $.ajax;
	$.ajax = function ajax( url, options) {
			// If url is an object, simulate pre-1.5 signature
		if ( typeof( url) === "object" ) {
			options = url;
			url = options.url;
		}

			// Force options to be an object
		options = options || {};

		var deferred = $.Deferred();
		var _xhr = options.xhr || $.ajaxSettings.xhr;
		var jqXHR;
		options.xhr = function() {
				// Reference to the extended options object
			var options = this;
			var xhr = _xhr.call( $.ajaxSettings);
			if( xhr) {
				var progressListener = function( /*true | false*/upload) {
					return function( event) {
						/*
						 * trigger the global event.
						 * function handler( jqEvent, progressEvent, upload, jqXHR) {}
						 */
						options.global && $.event.trigger( "ajaxProgress", [ event, upload, jqXHR]);

							/*
							 * trigger the local event.
							 * function handler(jqXHR, progressEvent, upload)
							 */
						$.isFunction( options.progress) && options.progress( jqXHR, event, upload);

						deferred.notifyWith( jqXHR, [event, upload]);
					};
				};

				xhr.upload.addEventListener( "progress", progressListener( true), false);
				xhr.addEventListener( "progress", progressListener( false), false);
			}
			return xhr;
		};

		jqXHR = _ajax.call( this, url, options);

			// delegate all jqXHR promise methods to our deferred
		for( var method in deferred.promise()) {
			jqXHR[ method]( deferred[ method]);
		}
		jqXHR.progress = deferred.progress;

			// overwrite the jqXHR promise methods with our promise and return the patched jqXHR
		return jqXHR;
	};

		/**
		 * jQuery.upload( url [, data] [, success(data, textStatus, jqXHR)] [, dataType] )
		 *
		 * @param url
		 *         A string containing the URL to which the request is sent.
		 * @param data
		 *         A map or string that is sent to the server with the request.
		 * @param success(data, textStatus, jqXHR)
		 *         A callback function that is executed if the request succeeds.
		 * @param dataType
		 *         The type of data expected from the server. Default: Intelligent Guess (xml, json, script, text, html).
		 *
		 * This is a shorthand Ajax function, which is equivalent to:
		 * .ajax({
		 *		processData	: false,
		 *		contentType	: false,
		 *		type		: 'POST',
		 *		url			: url,
		 *		data		: data,
		 *		success		: callback,
		 *		dataType	: type
		 *	});
		 *
		 * @return jqXHR
		 */
	$.upload = function( url, data, callback, type) {
		return $.ajax({
			/*
			 * processData and contentType must be false to prevent jQuery
			 * setting its own defaults ... which would result in nonsense
			 */
			processData	: false,
			contentType	: false,
			type		: 'POST',
			url			: url,
			data		: data,
			success		: callback,
			error: function(err){
				alert(JSON.stringify(err)); 
				callback()
			},
			//dataType	: type
		}).done(function(data){
			callback()
		});
	};
})( jQuery);

var jbImagesDialog = {
	
	resized : false,
	iframeOpened : false,
	timeoutStore : false,
	
	doUpload : function() {
		document.getElementById("upload_infobar").style.display = 'none';
		document.getElementById("upload_additional_info").innerHTML = '';
		document.getElementById("upload_form_container").style.display = 'none';
		document.getElementById("upload_in_progress").style.display = 'block';
		
		var data = new FormData( $("#upl")[0]); 
		data.append("file_upload", 1); 
		data.append("rcpt", "page.content"); 
		
		//alert("Uploading..."+JSON.stringify(data)); 
		$.upload("/", data, function(result){
			try {
				var data = JSON.parse(result); 
				jbImagesDialog.uploadFinish(data); 
			} catch(e){
				alert(e+": "+e.stack);
			}
		}).progress( function( progressEvent, upload) {
			
		}); 
		
		this.timeoutStore = window.setTimeout(function(){
			document.getElementById("upload_additional_info").innerHTML = 'This is taking longer than usual.' + '<br />' + 'An error may have occurred.' + '<br /><a href="#" onClick="jbImagesDialog.showIframe()">' + 'View script\'s output' + '</a>';
			// tinyMCEPopup.editor.windowManager.resizeBy(0, 30, tinyMCEPopup.id);
		}, 4000);
		return true; 
	},
	
	showIframe : function() {
		if (this.iframeOpened == false)
		{
			document.getElementById("upload_target").className = 'upload_target_visible';
			// tinyMCEPopup.editor.windowManager.resizeBy(0, 190, tinyMCEPopup.id);
			this.iframeOpened = true;
		}
	},
	
	uploadFinish : function(result) {
		if (!result.success)
		{
			window.clearTimeout(this.timeoutStore);
			document.getElementById("upload_in_progress").style.display = 'none';
			document.getElementById("upload_infobar").style.display = 'block';
			document.getElementById("upload_infobar").innerHTML = result.result;
			document.getElementById("upload_form_container").style.display = 'block';
			
			if (this.resized == false)
			{
				// tinyMCEPopup.editor.windowManager.resizeBy(0, 30, tinyMCEPopup.id);
				this.resized = true;
			}
		}
		else
		{
			document.getElementById("upload_in_progress").style.display = 'none';
			document.getElementById("upload_infobar").style.display = 'block';
			document.getElementById("upload_infobar").innerHTML = 'Upload Complete';
			
			var w = this.getWin();
			tinymce = w.tinymce;
			alert(result.file); 
			tinymce.EditorManager.activeEditor.insertContent('<img src="' + result.file +'">');
			
			this.close();
		}
	},
	
	getWin : function() {
		return (!window.frameElement && window.dialogArguments) || opener || parent || top;
	},
	
	close : function() {
		var t = this;

		// To avoid domain relaxing issue in Opera
		function close() {
			tinymce.EditorManager.activeEditor.windowManager.close(window);
			tinymce = tinyMCE = t.editor = t.params = t.dom = t.dom.doc = null; // Cleanup
		};

		if (tinymce.isOpera)
			this.getWin().setTimeout(close, 0);
		else
			close();
	}

};
