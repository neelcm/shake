$(document).ready(function(){
	$("#message").html("It's working!"); 
	
	$("button[name='test']").click(function(){
		server.exec("ident", ["Admin"]).done(function(){
			window.location.reload(); 
		}); 
	}); 
}); 
