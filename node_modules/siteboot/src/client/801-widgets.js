$ = $.noConflict(); 

$.fn.widget = function(){
	var widget_id = $(this).attr("widget-id"); 
	$(this).find("#edit-code-modal").bind("beforeShow", function(){
		var self = $(this); 
		
		$.post(window.location.path, {
			rcpt: "res.widget", 
			get_code: true
		}, function(data){
			self.find(".modal-body .code").val("Hello World!"); 
		}); 
	}); 
	/*$(this).find(".controls button[name='edit-code']").click(function(){
		
	}); */
}

$(document).ready(function(){
	$(".widget").each(function(i, v){
		$(v).widget(); 
	}); 
}); 
