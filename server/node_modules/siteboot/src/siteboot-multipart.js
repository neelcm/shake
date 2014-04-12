
Server.multipart = function(){
	var formidable = require("formidable"); 
	
	return function(req, res, next){
		if(req.method != "POST"){
			next(); 
			return; 
		}
		
		var form = new formidable.IncomingForm();
		form.parse(req._request, function(err, fields, files) {
			req.post = {
				files: files, 
				fields: fields
			}
			
			console.debug("POST FORM: "+req.path+" > "+JSON.stringify(fields)+" > "+JSON.stringify(files)); 
			
			next(); 
		}); 
	}
}
