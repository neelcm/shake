Server.file_upload = function(){
	return function(req, res, next){
		if(req._request.method != "PUT"){
			next(); 
			return; 
		}
		
		console.debug("PUT: "+req._request.body); 
		req._request.on('data', function(chunk) {
			console.log("Received body data:");
			console.log(chunk.toString());
		});
		req._request.on('end', function() {
			next("end"); 
		});
	}
}
