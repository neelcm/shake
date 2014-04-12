Server.client = function(){
	return function(req, res, next){
		// time to serve some files
		if("fx-get-client-scripts" in req.args){
			res.writeHead(200, {
				"Content-type": "text/javascript"
			}); 
			res.write("var session = "+JSON.stringify(req.session||{})+"; \n"+Client.client_code); 
			res.end(); 
		} else if("fx-get-client-styles" in req.args){
			res.writeHead(200, {
					"Content-type": "text/css"
			}); 
			res.write(Client.client_style); 
			res.end(); 
		} else {
			next(); 
		}
	}
}
