/** 
 * Makes it possible to serve static files from directory pointed to by root.
 * 
 * Server GET requests of the form /<file> will be translated to /root/<file>
 **/
Server.static = function(root){
	return function(){
		return function(req, res, next){
			var mime_types = {
				'.html': "text/html",
				'.css':  "text/css",
				'.js':   "text/javascript",
				'.jpg': "image/jpeg",
				'.jpeg': "image/jpeg",
				'.png': "image/png"
			};
			// first try to serve an ordinary static file if it exists
			var filepath = this.vfs.resolve(req.path); 
			if(fs.existsSync(filepath)){
				console.debug("GET STATIC: "+req.path);
				
				fs.readFile(filepath, "binary", function(err, data){
					if(err) {
						res.writeHead(404, {}); 
						res.write("Requested file not found!"); 
						res.end(); 
					} else {
						res.writeHead(200, {
							"Content-type": mime_types[Path.extname(req.path)],
							"Cache-Control": "public max-age=120"
						}); 
						res.write(data, "binary"); 
						res.end(); 
					}
				});
			} else {
				next(); 
			}
		}
	}
}
