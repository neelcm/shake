Server.dom = function(){
	
	return function(req, res, next){
		jsdom.env({
			html: "<div>test</div>", 
			scripts: [],
			done: function(errors, window){
				if(errors){
					console.error(errors); 
				} else {
					req.window = window; 
					req.document = window.document; 
				}
				next(); 
			}
		}); 
	}
}
