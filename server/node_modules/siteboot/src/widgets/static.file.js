var fs = require("fs"); 
var path = require("path"); 

var mime_types = {
	'.html': "text/html",
	'.css':  "text/css",
	'.js':   "text/javascript",
	'.jpg': "image/jpeg",
	'.jpeg': "image/jpeg",
	'.png': "image/png"
};
/*
var Page = function(){

}

Page.prototype.render = function(req){
	var result = this.server.defer(); 
	var self = this; 
	
	// first try to serve an ordinary static file if it exists
	var filepath = self.server.vfs.resolve("/"+req.path); 
	if(fs.existsSync(filepath)){
		console.debug("GET STATIC: "+req.path);
		
		fs.readFile(filepath, "binary", function(err, data){
			if(err) {
				result.resolve({
					code: 404,
					data: "Error reading file: "+err
				});  
				return; 
			}
			
			result.resolve({
				code: 200,
				headers: {
					"Content-type": mime_types[path.extname(req.path)],
					"Cache-Control": "public max-age=120"
				},
				data: data,
				type: "binary"
			});  
		});
	} else {
		result.reject(); 
	}
	
	return result.promise; 
}


exports.module = {
	type: Page
}
*/
